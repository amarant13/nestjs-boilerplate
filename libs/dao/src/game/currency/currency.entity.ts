import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from '@libs/dao/base/time/base-time.entity';

@Entity('currency')
export class Currency extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ comment: '유저 아이디', unsigned: true })
  userId: number;

  @Column({
    comment: '캐쉬',
    unsigned: true,
    default: 0,
  })
  cash: number;

  @Column({
    comment: '골드',
    unsigned: true,
    default: 0,
  })
  gold: number;

  @Column({
    comment: '다이아몬드',
    unsigned: true,
    default: 0,
  })
  diamond: number;
}
