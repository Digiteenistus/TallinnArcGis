import schedule from "node-schedule";
import { ilmateenistusDataInterval } from "./controllers/data/ilmateenistus.controller";
import { airviroDataInterval } from "./controllers/data/ohuseire.controller";
import { ehrDataInterval } from "./controllers/data/ehr.controller";
import { TIKDataInterval } from "./controllers/data/tik.controller";

export async function scheduledEvents() {

  // Once every hour fifth minute
  const hourRule = new schedule.RecurrenceRule();
  hourRule.tz = "Europe/Tallinn";

  hourRule.minute = 5;
  hourRule.second = 30;

  schedule.scheduleJob(hourRule, async () => {
    await ilmateenistusDataInterval();
    await airviroDataInterval();
  });

  // Once every month
  const monthRule = new schedule.RecurrenceRule();
  monthRule.tz = "Europe/Tallinn";

  // monthRule.date = 1;
  // monthRule.hour = 0;
  // monthRule.minute = 0;
  // monthRule.second = 30;

  // DEMO every 6 hours starting at 3.30
  monthRule.hour = [3, 9, 15, 21];
  monthRule.minute = 30;
  monthRule.second = 30;
  // DEMO

  schedule.scheduleJob(monthRule, async () => {
    ehrDataInterval();
  });

  // Once every 6 hours starting at 00.30
  const TIKRule = new schedule.RecurrenceRule();
  TIKRule.tz = "Europe/Tallinn";

  TIKRule.hour = [0, 6, 12, 18];
  TIKRule.minute = 30;
  TIKRule.second = 30;

  schedule.scheduleJob(TIKRule, async () => {
    await TIKDataInterval();
  });
};
