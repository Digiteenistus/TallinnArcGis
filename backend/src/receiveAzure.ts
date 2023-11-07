import { EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";

const connectionString = "Endpoint=sb://eventpipeline.servicebus.windows.net/;SharedAccessKeyName=Toilmateenistus;SharedAccessKey=m3m8bHVVb+jyUVnflf/i0Hbd14HBuTQpQ+AEhGIuZao=;EntityPath=ilmateenistus";
const eventHubName = "ilmateenistus";
const consumerGroup = "$Default"; // name of the default consumer group

export async function listen() {
console.log("listening")
  // Create a consumer client for the event hub by specifying the checkpoint store.
  const consumerClient = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  // Subscribe to the events, and specify handlers for processing the events and errors.
  const subscription = consumerClient.subscribe({
      processEvents: async (events, context) => {
        console.log("events", events)
        if (events.length === 0) {
          console.log(`No events received within wait time. Waiting for next interval`);
          return;
        }

        for (const event of events) {
          console.log(`Received event: '${event}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`);
        }
        // Update the checkpoint.
        await context.updateCheckpoint(events[events.length - 1]);
      },

      processError: async (err, context) => {
        console.log(`Error : ${err}`);
      }
    },
    // { startPosition: earliestEventPosition }
  );

  // After 30 seconds, stop processing.
  await new Promise<void>((resolve) => {
    setTimeout(async () => {
      await subscription.close();
      await consumerClient.close();
      resolve();
    }, 30000);
  });
}