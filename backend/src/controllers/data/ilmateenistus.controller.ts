import { NextFunction, Request, Response } from "express";
import https from "https";
import * as xml2js from "xml2js";
import { sendToAzureEventsHub } from "../../azureEventHub";

interface WeatherStation {
  name: string,
  wmocode: string,
  longitude: string,
  latitude: string,
  phenomenon: string,
  visibility: {value: string, unit: string},
  precipitations: {value: string, unit: string},
  airpressure: {value: string, unit: string},
  relativehumidity: {value: string, unit: string},
  airtemperature: {value: string, unit: string},
  winddirection: {value: string, unit: string},
  windspeed: {value: string, unit: string},
  windspeedmax: {value: string, unit: string},
  waterlevel: {value: string, unit: string},
  waterlevel_eh2000: {value: string, unit: string},
  watertemperature: {value: string, unit: string},
  uvindex: {value: string, unit: string}
};

const preDefinedWeatherUnits = [
  {
    key: "visiblity",
    unit: "km",
  },
  {
    key: "waterlevel",
    unit: "cm",
  },
  {
    key: "waterlevel_eh2000",
    unit: "cm",
  },
  {
    key: "precipitations",
    unit: "mm",
  },
  {
    key: "windspeed",
    unit: "m/s",
  },
  {
    key: "windspeedmax",
    unit: "m/s",
  },
  {
    key: "airpressure",
    unit: "hPa",
  },
  {
    key: "relativehumidity",
    unit: "%",
  },
  {
    key: "winddirection",
    unit: "°",
  },
  {
    key: "airtemperature",
    unit: "°C",
  },
  {
    key: "watertemperature",
    unit: "°C",
  },
  {
    key: "uvindex",
    unit: "",
  },
];

export const dataDemo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {res.send({Hello: "APP is running..."})};

// Get Ilmateenistus XML data -> convert to JSON -> send to Azure Eventpipeline
// export const getIlmateenistusData = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   https.get(
//     "https://www.ilmateenistus.ee/ilma_andmed/xml/observations.php",
//     function (response) {
//       let data: string = "";

//       response.on("data", function (stream) {
//         data += stream;
//       });

//       response.on("end", function () {
//         // Without this line, parseString converts xml tag values to array
//         const parser = new xml2js.Parser({ explicitArray: false });

//         parser.parseString(data, async function (error, result) {
          
//           if (error === null) {
//             let finalWeatherStationArray: WeatherStation[] = [];

//             result.observations.station.forEach((element:WeatherStation) => {
//               if(
//                 element.name === "Tallinn-Harku" ||
//                 element.name === "Pirita" ||
//                 element.name === "Kloostrimetsa" ||
//                 element.name === "Rohuneeme" ||
//                 element.name === "Naissaare" ||
//                 element.name === "Hüüru"
//               ){
//                 finalWeatherStationArray.push(element);
//               };
//             });

//             const batch = await sendToAzureEventsHub(finalWeatherStationArray).catch((err) => {
//               console.log({ error: `Send data to Eventpipeline ${err}`})
//             });
//             res.json(batch)
//           } else {
//             res.send({ error: `Get data from https://www.ilmateenistus.ee/ilma_andmed/xml/observations.php ${error}`});
//           };
//         });
//       });
//     }
//   );
// };

// Get Ilmateenistus XML data -> convert to JSON -> send to Azure Eventpipeline
export const ilmateenistusDataInterval = async () => {

  const ilmateenistusConnectionString:string = process.env.ILMATEENISTUS_CONNECTIONSTRING!;
  const ilmateenistusEventHubName:string = process.env.ILMATEENISTUS_EVENT_HUB!;

  https.get(
    "https://www.ilmateenistus.ee/ilma_andmed/xml/observations.php",
    function (response) {
      let data: string = "";

      response.on("data", function (stream) {
        data += stream;
      });

      response.on("end", function () {
        // Without this line, parseString converts xml tag values to array
        const parser = new xml2js.Parser({ explicitArray: false });

        parser.parseString(data, async function (error, result) {
          if (error === null) {
            // Send only 4 weather stations
            let finalWeatherStationArray: WeatherStation[] = [];
            result.observations.station.forEach((element:WeatherStation) => {
              if(
                element.name === "Tallinn-Harku" ||
                element.name === "Pirita" ||
                element.name === "Kloostrimetsa" ||
                element.name === "Rohuneeme" ||
                element.name === "Naissaare" ||
                element.name === "Hüüru"
              ){
                for (const [key, value] of Object.entries(element)) {
                  // If value is empty then delete the property
                  if(!value){
                    delete element[key];
                  };

                  // Find and add predefined units to data
                  let preDefinedValues = preDefinedWeatherUnits.find(
                    (val) => val.key === key
                  );
                  if(preDefinedValues){
                    // If value is empty then delete the property
                    if(value){
                      element[key] = {value: value, unit: preDefinedValues.unit};
                    } else{
                      delete element[key];
                    }
                  };
                };
                finalWeatherStationArray.push(element);
              };
            });

            await sendToAzureEventsHub(finalWeatherStationArray, ilmateenistusConnectionString, ilmateenistusEventHubName).catch((err) => {
              console.log({ error: `Send data to Eventpipeline ${err}`})
            });
            console.log({ message: `Data sent to Eventpipeline`})
          } else {
            console.log({ error: `Get data from https://www.ilmateenistus.ee/ilma_andmed/xml/observations.php ${error}`});
          };
        });
      });
    }
  );
};
