import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStats(): Promise<{ participants: number; tournamentsTotal: number; tournamentsFinished: number; teams: number }> {
    const [participants, tournamentsTotal, tournamentsFinished, teams] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM users`),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM tournaments`),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM tournaments WHERE status = 'finished'`),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM teams`),
    ]);
    return {
      participants:         Number(participants[0].cnt),
      tournamentsTotal:     Number(tournamentsTotal[0].cnt),
      tournamentsFinished:  Number(tournamentsFinished[0].cnt),
      teams:                Number(teams[0].cnt),
    };
  }
}
