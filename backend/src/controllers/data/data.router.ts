import express from "express";
import { dataDemo } from "./ilmateenistus.controller";

const router = express.Router();

router.get('/', dataDemo);

export {router as dataRouter};