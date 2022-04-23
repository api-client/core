import { Internet, Types, IDataMockInit, Person, Random } from '@pawel-up/data-mock';
import { IUser, Kind as UserKind } from '../../models/store/User.js';

export interface IUserInit {
  noEmail?: boolean;
  noPicture?: boolean;
  noProvider?: boolean;
}

export class User {
  person: Person;
  types: Types;
  internet: Internet;
  random: Random;

  constructor(init: IDataMockInit={}) {
    this.person = new Person(init);
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
    this.random = new Random(init.seed);
  }

  user(init: IUserInit = {}): IUser {
    const result: IUser = {
      kind: UserKind,
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
}
