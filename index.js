var express = require("express");
var router = require("./router/router");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/openapi.yaml');



const PORT = process.env.PORT || 3030;

var app = express();




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors());

app.use("/", router);

app.listen(PORT, () => {
	console.log(`server started on port ${PORT}`);
});
