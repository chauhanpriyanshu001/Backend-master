const express = require("express");
const app = express();
const multer = require("multer");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { updateUserSocketId } = require('./controllers/socketModule');
const socketHandler = require('./controllers/socketHandler');

const io = socketHandler.initializeSocketServer(server);
app.set('socketio', io); 
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
require("./config/config");
require("./dbConnectivity/dbConnection");
require("./controllers/cityCron");
//update admin refresh attempt 2 
app.use(
  cors({
    allowedHeaders: ["Content-Type", "token", "authorization"],
    exposedHeaders: ["token", "authorization"],
    origin: "*",
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
    preflightContinue: false,
  })
);

app.use(multer().any());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

app.use("/api/v1", require("./routers/indexRouter"));
io.on("connection",(socket)=>{
  console.log("Socket connected",socket.id);  
  socket.on("signin", (data) => {
     updateUserSocketId(data.user_id,data.userType,socket.id);
  });
});
const swaggerDefinition = {
  info: {
    title: "TEXLY_API_DOCS",
    version: "5.0.0",
    description: "Swagger API Docs",
  },
  host: `${global.gConfig.swaggerURL}`,
  basePath: "/",
};
const options = {
  swaggerDefinition: swaggerDefinition,
  apis: ["./routers/*/*.js"],
};
const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.status(200).json({ message: "ok" });
});
server.listen(global.gConfig.node_port, () => {
  console.log("server is running on port :", process.env.PORT || global.gConfig.node_port);
 // console.log("Environment",global.gConfig);
});
