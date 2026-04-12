import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStats(): Promise<{ participants: number; tournaments: number; teams: number }> {
    const [participants, tournaments, teams] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM users WHERE role != 'banned'`),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM tournaments`),
      this.dataSource.query(`SELECT COUNT(*) AS cnt FROM teams`),
    ]);
    return {
      participants: Number(participants[0].cnt),
      tournaments: Number(tournaments[0].cnt),
      teams: Number(teams[0].cnt),
    };
  }
}
