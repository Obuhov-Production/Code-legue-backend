import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('chat_room_members')
export class ChatRoomMember {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    room: string;

    @PrimaryColumn({ type: 'int' })
    user_id: number;

    @CreateDateColumn()
    added_at: Date;

    @Column({ nullable: true, type: 'int' })
    added_by: number | null;
}
