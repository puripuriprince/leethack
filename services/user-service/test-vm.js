// Simple test to check if VM manager loads correctly
const { vmManager } = require('./src/vm-manager.ts');

console.log('vmManager:', vmManager);
console.log('vmManager methods:', Object.getOwnPropertyNames(vmManager));
