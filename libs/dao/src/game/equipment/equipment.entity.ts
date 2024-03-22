import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '@libs/dao/base/time/base-time.entity';

@Entity('equipment')
export class Equipment extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ comment: '장비 아이디', unsigned: true })
  id: number;

  @Index()
  @Column({ comment: '유저 아이디', unsigned: true })
  userId: number;

  @Column({ comment: '데이터 장비 아이디', unsigned: true })
  dataEquipmentId: number;

  @DeleteDateColumn({ comment: '레코드 삭제 시간' })
  deleteAt: Date;
}
