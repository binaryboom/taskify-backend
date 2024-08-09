const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: {type: String,minLength:5 ,required: true, 
        validate: {
            validator: function(v) {
                // Regular expression to ensure the password is alphanumeric and contains at least one digit
                return /^(?=.*\d)[a-zA-Z\d]+$/.test(v);
            },
            message: props => `${props.value} is not a valid password! It must be alphanumeric and contain at least one number.`
        }
    }
})

const User= mongoose.model('User',UserSchema)
module.exports=User;