import { EventHubProducerClient } from "@azure/event-hubs";

export async function sendToAzureEventsHub(data:any, connectionString: string, eventHubName: string) {
    // Create a producer client to send messages to the event hub.
    const producer = new EventHubProducerClient(connectionString, eventHubName);
  
    // Prepare a batch of three events.
    let batch = await producer.createBatch();

    // More than 1mb of data
    // for (let i = 0; i < data.length; i++) {
    //     console.log(data[i])
    //     batch.tryAdd({body: data[i]});
    //     await producer.sendBatch(batch);
    // }

    // Less than 1mb of data
    batch.tryAdd({body: data});
      
    // Send the batch to the event hub.
    await producer.sendBatch(batch);
  
    // Close the producer client.
    await producer.close();
};