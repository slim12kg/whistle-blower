//     Whistle-blower.js 1.0.0
//     http://nexus.com.ng
//     (c) 2017 Alofe Oluwafemi
//     PrimeNexus

import serialize from "form-serialize";
import _ from "underscore";
import rules from "./rules";
import validationMsgs from "./messages";
import {convert$ObjAsJson} from "./helper"

(function()
{
    var
        root        = this,
        inputs      = {},
        errors      = {},
        messages    = {},
        userMsgs    = {};

    /**
     * Save reference to whistle object
     * @param culprit : object| jquery instance | DOMElement
     * @param options
     * @returns {whistle}
     * @private
     */
    var _w = function(culprit,options)
    {
        options = options || {};

        return new whistle(culprit,options)
    };

    /**
     * Reference to the whistle object
     * @param culprit
     * @param options
     * @returns {_w}
     * @private
     */
    var whistle = function(culprit,options)
    {
        var type;

        if(arguments.length > 0)
        {
            type = toString.call(culprit);

            if (culprit instanceof _w) return culprit;

            if (culprit.jquery)                              //Jquery instance
            {
                inputs = convert$ObjAsJson(culprit.serializeArray());
            } else if (type === "[object Object]")            //Instance of Object e.g {}
            {
                inputs = culprit;
            } else if (type === "[object HTMLFormElement]")   //Instance of DOM using document.getElement
            {
                inputs = serialize(culprit, _.extend({hash: true}, options));
            } else {
                console.error('#sad# Cannot handle type of form ', type, ' passed to whistler');
            }

            return _w;
        }

        console.error('#sad# whistler expects at least one argument');

    };

    /**
     * Extend own property
     * Allows to add custom validation methods
     *
     * @param identifier
     * @param method
     * @param message
     */
    _w.extend = function(identifier,method,message)
    {
        rules[identifier]       = method;
        messages[identifier]    = message;
    };

    //Export to Window Object
    root._w = _w;

    _w.validate = function(rules,msgs)
    {
        //Empty errors from previous
        //validation
        errors = {};

        _.extend(userMsgs,msgs);

        if(_.isEmpty(rules) || !_.isObject(rules))
        {
            console.error('#sad# No rules supplied for validation');

            return false;
        }

        loopRules(rules);
    };

    /**
     * Loop through validation rules
     * @param rules
     */
    function loopRules(rules)
    {
        _.each(rules,function(rule,field)
        {
            if(_.isArray(rule))
            {
                _.each(rule,function(validator)
                {
                    performValidation(validator,field);
                })
            }else
            {
                performValidation(rule,field);
            }
        });

        console.log(inputs,rules,errors,messages);
    }

    /**
     * Call validator method
     * @param rule
     * @param field
     */
    function performValidation(rule,field)
    {
        var value,passed;

        //Check if field under validation exist
        if(!_.isEmpty(inputs[field]))
        {
            value   = inputs[field];
            passed  = rules[rule].call(_w,value);

            //If Validation fails
            if(!passed)
            {
                applyErrors(field,rule);
                applyMessages(field,rule);
            }
        }
    }

    /**
     * Append field error into errors Object
     *
     * Object
     * @param field
     * @param rule
     */
    function applyErrors(field,rule)
    {
        if(!_.isEmpty(errors[field])) errors[field].push(rule);

        if(_.isEmpty(errors[field])) errors[field] =  [rule];
    }

    /**
     * Append field messages into messages Object
     *
     * @param field
     * @param rule
     */
    function applyMessages(field,rule)
    {
        var message     = _.isEmpty(userMsgs[rule])
                        ? (_.isEmpty(validationMsgs[rule]) ? rule : validationMsgs[rule])
                        : userMsgs[rule];

        messages[field] = message.replace('{attribute}',field);
    }

}.call(window));