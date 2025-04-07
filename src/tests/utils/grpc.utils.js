
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

if(!process.env.PROTO_PATH) {
    throw new Error('PROTO_PATH is required');
}
const protoPath = path.join(__dirname, process.env.PROTO_PATH);

if(!process.env.PROTO_URL){
    throw new Error('PROTO_URL is required');
}

const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

module.exports = {
    protoDescriptor,
    getPackage(name) {
        return protoDescriptor[name];
    },
    getConfig() {
        return {
            url: process.env.PROTO_URL || 'localhost:50051', insecure: grpc.credentials.createInsecure()
        }
    }
}