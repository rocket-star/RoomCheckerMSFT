// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const mongoose = require('mongoose');
const request = require('request');

mongoose.connect(
    'mongodb://localhost:27017/room-checker',
    {
      useNewUrlParser: true,
    },
  );
mongoose.Promise = global.Promise;
  
const Codec = require('../models/codec');

/**
 * This function book a room /!\ You must be connected to the same network as the codec /!\
 * @param {string} meetingTitle : Title of the meeting
 * @param {string} startTime : the start date in format YYYY-MM-DDT00:00:00Z
 * @param {string} endTime : the end date in format YYYY-MM-DDT00:00:00Z
 * @param {string} ip : the ip adress of the codec to which you want to send http request
 */
function bookRoom(meetingTitle, startTime, endTime, ip) {
    const options = {
      method: 'POST',
      url: `https://${ip}/bookingsputxml`,
      headers:
          {
            Authorization: 'Basic cHJlc2VuY2U6QzFzYzAxMjM=',
            'Content-Type': 'text/xml',
          },
      body: `<?xml version='1.0'?>\n<Bookings item="1" status="OK">\n  <Booking item="1">\n    <Id item="1">1</Id>\n    <Title item="1">${meetingTitle}</Title>\n    <Agenda item="1"></Agenda>\n    <Privacy item="1">Public</Privacy>\n    <Organizer item="1">\n      <FirstName item="1">Demo</FirstName>\n      <LastName item="1"></LastName>\n      <Email item="1"></Email>\n    </Organizer>\n    <Time item="1">\n      <StartTime item="1">${startTime}</StartTime>\n      <StartTimeBuffer item="1">300</StartTimeBuffer>\n      <EndTime item="1">${endTime}</EndTime>\n      <EndTimeBuffer item="1">0</EndTimeBuffer>\n    </Time>\n    <MaximumMeetingExtension item="1">5</MaximumMeetingExtension>\n    <BookingStatus item="1">OK</BookingStatus>\n    <BookingStatusMessage item="1"></BookingStatusMessage>\n    <Webex item="1">\n      <Enabled item="1">False</Enabled>\n      <MeetingNumber item="1"></MeetingNumber>\n      <Password item="1"></Password>\n    </Webex>\n    <Encryption item="1">BestEffort</Encryption>\n    <Role item="1">Master</Role>\n    <Recording item="1">Disabled</Recording>\n    <DialInfo item="1">\n      <Calls item="1">\n        <Call item="1">\n          <Number item="1">rudferna@cisco.com</Number>\n          <Protocol item="1">SIP</Protocol>\n          <CallRate item="1">6000</CallRate>\n          <CallType item="1">Video</CallType>\n        </Call>\n      </Calls>\n      <ConnectMode item="1">OBTP</ConnectMode>\n    </DialInfo>\n  </Booking>\n</Bookings>`,
    };
    console.log(options.body);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  
    request(options, (error, response, body) => {
      if (error) throw new Error(error);
  
      console.log(body);
    });
}

/**
 * This function return current Date in format YYYY-MM-DDT00:00:00Z
 * @param {integer} addingTime 
 */
function formatDate(addingTime = 1) {
    const time = new Date().getTime() + addingTime * 60000;
    const date = new Date(time);
    let hours = date.getHours() - 1;
    let day = date.getDate();
    let minutes = date.getMinutes();
    let month = date.getMonth() + 1;
    let seconds = date.getSeconds();
    hours = hours < 10 ? `0${hours}` : hours;
    day = day < 10 ? `0${day}` : day;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    month = month < 10 ? `0${month}` : month;
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    const strTime = `${hours}:${minutes}:${seconds}`;
    return `${date.getFullYear()}-${month}-${day}T${strTime}Z`;
}

/**
 * Return the codec who have the field "name" equal to variable name
 * @param {string} name : The name of the codec
 */
function getOneCodec(name) {
    return Codec.findOne({ name }, (err, codec) => {
      if (!err) {
        return new Promise((resolve) => {
          resolve(codec);
        });
      }
  
      throw err;
    });
}

/**
 * Return all the codecs information that are in db
 */
function getCodec() {
    return Codec.find({}, (err, docs) => {
      if (!err) {
        return new Promise((resolve) => {
          resolve(docs);
        });
      }
      throw err;
    });
}

function getColor(codec) {
    if (codec.status === true) {
      return 'Good';
    }
    return 'Attention';
  }
  
  function getStatus(codec) {
    if (codec.status === true) {
      return 'Available';
    }
    return 'Busy';
  }
  
  function getNbPeople(codec) {
    if (codec.status === true) {
      return '';
    }
    return `: ${codec.nbPeople} people(s)`;
  }

  function getRoomsAvailable(codecs) {
    const choices = [];
    codecs.forEach((codec) => {
      if (codec.status === true) {
        choices.push({
          title: codec.name,
          value: codec.name,
        });
      }
    });
    return choices;
  }

function getCard(allCodecs, message) {
    const v = [
      {
        type: 'TextBlock',
        text: 'List of rooms',
        weight: 'Bolder',
      },
  
    ];
    allCodecs.forEach((codec) => {
      v.push({
        type: 'ColumnSet',
        separator: true,
        columns: [
          {
            type: 'Column',
            width: 'auto',
            items: [
              {
                type: 'TextBlock',
                text: codec.name,
                horizonalAligment: 'Right',
                size: 'Large',
                weight: 'Lighter',
              },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: 'Status',
                horizontalAlignment: 'Right',
                isSubtle: true,
              },
              {
                type: 'TextBlock',
                text: getStatus(codec) + getNbPeople(codec),
                horizontalAlignment: 'Right',
                spacing: 'None',
                size: 'Large',
                color: getColor(codec),
              },
            ],
          },
        ],
        spacing: 'Large',
      });
    });
    v.push({
      type: 'ActionSet',
      actions: [{
        type: 'Action.ShowCard',
        title: 'Book a Room',
        card: {
          type: 'AdaptiveCard',
          body: [{
            type: 'TextBlock',
            text: 'Select the room',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'Input.ChoiceSet',
            id: 'RoomChoice',
            style: 'compact',
            isMultiSelect: false,
            choices: getRoomsAvailable(allCodecs),
          },
          {
            type: 'Input.ChoiceSet',
            id: 'MeetingTemp',
            style: 'expanded',
            isMultiSelect: false,
            choices: [
              {
                title: '30min',
                value: '30',
              },
              {
                title: '45min',
                value: '45',
              },
              {
                title: '60min',
                value: '60',
              },
            ],
          },
          {
            type: 'Input.Text',
            id: 'MeetingTitle',
            isMultiline: false,
            placeholder: 'Title of your meeting?',
          },
          ],
          actions: [
            {
              type: 'Action.Submit',
              title: 'OK',
              data: {
                type: 'book',
                personEmail: message,
              },
            },
          ],
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        },
      }],
    });
    return v;
  }

const { ActivityHandler, CardFactory, TurnContext } = require('botbuilder');



class ProactiveBot extends ActivityHandler {
    constructor(conversationReferences) {
        super();

        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences = conversationReferences;

        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const welcomeMessage = 'Welcome to the RoomChecker Bot. This bot sends a notification when a user books a room (message everyone who has previously messaged this bot.)';// Navigate to http://c45e1d71.ngrok.io/api/notify to proactively message everyone who has previously messaged this bot.
                    await context.sendActivity(welcomeMessage);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            switch (text) {
                case 'hello':
                case 'hi':
                    await context.sendActivity(`You said "${ context.activity.text }"`);
                    break;
                case 'intro':
                case 'help':
                    await context.sendActivity('Here are my skills:  \n' + '- ***rooms*** : shows informations about rooms status (free or busy)  \n');
                    break;
                case 'rooms':
                    const allCodecs = await getCodec();
                    await context.sendActivity({
                        text: 'Here is an Adaptive Card:',
                        attachments: [CardFactory.adaptiveCard({
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                            "type": "AdaptiveCard",
                            "version": "1.0",
                            "body": getCard(allCodecs, "sarah@ciscofrance.com"),
                })]
                    });
                    break;

                default: //code to handle the submit action of Adaptive card
                    if(typeof context.activity.value !== 'undefined' && context.activity.value.type === 'book'){
                        const duration = context.activity.value.MeetingTemp;
                        const roomName = context.activity.value.RoomChoice;
                        const title = context.activity.value.MeetingTitle;
                        const startTime = formatDate();
                        const endTime = formatDate(duration);
                        await context.sendActivity('Ok I book the room ' + roomName + ' for ' + duration + ' minutes. Meeting: ' + title);
                        const codec = await getOneCodec(roomName);
                        const { ip } = codec;
                        bookRoom( title, startTime, endTime, ip);
                    }
                    else{
                    await context.sendActivity(`Sorry, I did not understand.
                    Try: ***help***`);
                    }
                }
            await next();
        });
    }

    addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }
}

module.exports.ProactiveBot = ProactiveBot;
