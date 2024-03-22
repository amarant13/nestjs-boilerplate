import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from '@libs/dao/base/time/base-time.entity';

@Entity('character')
export class Character extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ comment: '캐릭터 아이디', unsigned: true })
  id: number;

  @Column({ comment: '유저 아이디', unsigned: true })
  userId: number;

  @Column({ comment: '데이터 캐릭터 아이디', unsigned: true })
  dataCharacterId: number;
}
