import { Internet, Types, DataMockInit, Person, Random } from '@pawel-up/data-mock';
// import { randomValue } from '@pawel-up/data-mock/src/lib/Http.js';
import { IUser, ISpaceUser, AccessControlLevel } from '../../models/User.js';


export interface IUserInit {
  noEmail?: boolean;
  noPicture?: boolean;
  noProvider?: boolean;
}

export interface ISpaceUserInit extends IUserInit {
  level?: AccessControlLevel;
  levelPool?: AccessControlLevel[];
}

const accessPool: AccessControlLevel[] = ['read', 'comment', 'write', 'admin', 'owner'];

export class User {
  person: Person;
  types: Types;
  internet: Internet;
  random: Random;

  constructor(init: DataMockInit={}) {
    this.person = new Person(init);
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
    this.random = new Random(init.seed);
  }

  user(init: IUserInit = {}): IUser {
    const result: IUser = {
      key: this.types.uuid(),
      name: this.person.name(),
    }
    if (!init.noEmail) {
      result.email = [{
        email: this.internet.email(),
        verified: this.types.boolean(),
      }];
    }
    if (!init.noPicture) {
      result.picture = {
        url: this.internet.avatar(),
      };
    }
    if (!init.noProvider) {
      result.provider = {
        refreshToken: this.types.uuid(),
      };
    }
    return result;
  }

  spaceUser(init: ISpaceUserInit = {}): ISpaceUser {
    const user = this.user(init) as ISpaceUser;
    if (init.level) {
      user.level = init.level;
    } else if (Array.isArray(init.levelPool)) {
      user.level = this.random.pickOne(init.levelPool);
    } else {
      user.level = this.random.pickOne(accessPool);
    }
    return user;
  }
}
