import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fraudIqRouter from "./fraudIq";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fraudIqRouter);

export default router;
