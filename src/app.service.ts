import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EntityManager, Connection } from 'typeorm';
import { Todo } from './todos/todos.entity';
import * as bunyan from 'bunyan';

const log = bunyan.createLogger({
  name: 'myapp',
  level: 'info',
});

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly connection: Connection,
  ) {}

  onApplicationBootstrap() {
    let i = 0;
    setInterval(() => {
      const baseMessageSegment =
        'Message logged with random value: ' +
        Math.floor(Math.random() * 1000000);

      const multiplier = Math.floor(Math.random() * 3) + 1;

      let extendedMessage = '';
      for (let i = 0; i < multiplier; i++) {
        extendedMessage += baseMessageSegment;
        if (i < multiplier - 1) extendedMessage += ' | ';
      }

      if (Math.random() < 0.05) {
        log.error(`[${i}] ${extendedMessage}`);
      } else {
        log.info(`[${i}] ${extendedMessage}`);
      }

      i++;
    }, 200);

    this.seed(JSON.parse(process.env.ZEROPS_RECIPE_DATA_SEED || '[]'));
  }

  async seed(data: string[]) {
    const seeded = await this.entityManager.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'todo');`,
    );

    if (seeded?.[0]?.exists === false && !!data?.length) {
      console.log('Seeding data for Zerops recipe ⏳');
      await this.connection.synchronize();
      await this.entityManager.save(
        Todo,
        data.map((text) => ({ text })),
      );
      console.log('Done ✅');
    }
  }
}
