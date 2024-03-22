import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from '@libs/dao/base/time/base-time.entity';

@Entity('item')
@Index(['userId', 'dataItemId'], { unique: true })
export class Item extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ comment: '아이템 아이디', unsigned: true })
  id: number;

  @Index()
  @Column({ comment: '유저 아이디', unsigned: true })
  userId: number;

  @Column({ comment: '데이터 아이템 아이디', unsigned: true })
  dataItemId: number;

  @Column({ comment: '아이템 개수', unsigned: true, default: 0 })
  count: number;
}
