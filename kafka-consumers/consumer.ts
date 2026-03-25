import { Kafka } from "kafkajs";

console.log({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: process.env.KAFKA_BROKER,
});

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER!],
});

const consumer = kafka.consumer({ groupId: "purchased-products-processors" });

type SafeParseReturnType = {
  status: "success" | "fail";
  data: any;
  error: unknown;
};

function safeParse(str: string): SafeParseReturnType {
  try {
    const result = JSON.parse(str);
    return { status: "success", data: result, error: null };
  } catch (error) {
    return { status: "fail", data: null, error: error };
  }
}

async function main() {
  await consumer.connect();
  console.log("Consumer Connected");

  await consumer.subscribe({ topic: "cdc.public.purchased_products" });

  await consumer.run({
    eachMessage: async ({ message, partition }) => {
      console.log(`Message received for partition:${partition}`);
      const msg = message.value?.toString();

      if (!msg) {
        console.log("No message value found");
        return;
      }

      const result = safeParse(msg);

      if (!result) {
        console.log("Unable to parse message");
        return;
      }

      const data = result.data?.payload?.after;

      console.log(
        `User:${data?.user_id} purchased product:${data?.product_id} of quantity:${data?.quantity}`,
      );
    },
  });
}

main().catch(console.error);
