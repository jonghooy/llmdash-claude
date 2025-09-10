const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  teams: [{
    name: {
      type: String,
      required: true
    },
    memberCount: {
      type: Number,
      default: 0
    },
    manager: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
departmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;