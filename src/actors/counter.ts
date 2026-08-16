import { actor } from "rivetkit";

export const counter = actor({
  state: {
    count: 0
  },
  actions: {
    increment: (c, amount: number = 1) => {
      c.state.count += amount;
      return c.state.count;
    },
    getCount: (c) => {
      return c.state.count;
    }
  }
});
