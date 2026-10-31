import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CollectorController } from './collector.controller'
import { CollectorService } from './collector.service'
import { ApplicationEntity } from '../applications/application.entity'
import { EventEntity } from './event.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity, EventEntity])],
  controllers: [CollectorController],
  providers: [CollectorService],
  exports: [CollectorService],
})
export class CollectorModule {}
