import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerDeviceSchema, toggleTrustDeviceSchema } from "@securevault/validators";
import { DEVICE_ENDPOINT } from "@securevault/constants";
import { DeviceController } from "../controllers/device.controller";
import { protect } from "../middlewares/auth.middleware";

const deviceRouter = new Hono();

// All device routes require authentication
deviceRouter.use("/api/devices", protect);
deviceRouter.use("/api/devices/*", protect);

deviceRouter.get(DEVICE_ENDPOINT.GET_DEVICES, DeviceController.getDevices);

deviceRouter.post(
 DEVICE_ENDPOINT.POST_REGISTER_DEVICE,
 zValidator("json", registerDeviceSchema),
 DeviceController.registerDevice,
);

deviceRouter.delete(
 DEVICE_ENDPOINT.DELETE_DEVICE,
 DeviceController.removeDevice,
);

deviceRouter.put(
 DEVICE_ENDPOINT.PUT_TRUST_DEVICE,
 zValidator("json", toggleTrustDeviceSchema),
 DeviceController.updateTrustStatus,
);

export { deviceRouter };
