const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const receiver = 'bot@screenforce-dev.com';

exports.handler = async(event) => {
    const rawMessage = event.Records[0].Sns.Message;
    const message = JSON.parse(rawMessage);
    const mail = message.mail;
    const sender = mail.source;
    if (sender === process.env.valid_sender) {
        let subject = mail.commonHeaders.subject;
        while (subject.substring(0, 5) === 'Fwd: ') {
            subject = subject.substring(5);
        }
        const rawContent = message.content;
        const content = decode(rawContent);
        const item = {
            "timestamp": { "S": content.date.timestamp },
            "subject": { "S": subject },
            "sender": { "S": sender },
            "plaintext": { "SS": Array.from(content.plaintext) },
            "markdown": { "S": content.markdown }
        };
        console.log(item);
        const archiveItem = {
            "timestamp": { "S": content.date.timestamp },
            "subject": { "S": subject },
            "year": { "N": content.date.year },
            "month": { "S": content.date.month },
            "day": { "N": content.date.day }
        };
        console.log(archiveItem);

        const saveparams = {
            TableName: "TestMail",
            Item: item,
            ReturnConsumedCapacity: "TOTAL"
        };
        const saved = await ddb.putItem(saveparams, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data);
            }
        }).promise();
        // add archive table
    } else {
        return 'unrecognized sender';
    }
};

function decode(content) {
    const payload = Buffer.from(content, 'base64').toString();
    const lines = payload.split("\n");
    let toReturn = {
        date: {
            year: 0,
            month: "",
            day: 0,
            timestamp: ""
        },
        plaintext: new Set(),
        markdown: ""
    };
    let boundary = "";
    let boundaryCount = 0;
    let marks = {
        plainStart: 0, // first line of plaintext section
        markStart: 0, // first line of markdown section
        markEnd: 0 // end of markdown section
    };
    for (let i in lines) {
        lines[i].trim();
        if (lines[i].substring(0, 47) === 'Content-Type: multipart/alternative; boundary="') {
            const end = lines[i].substring(47);
            boundary = '--' + end.substring(0, end.length - 2);
        }
        if (boundary !== "") {
            if (lines[i] === boundary + '\r' || lines[i] === boundary + '--\r') {
                boundaryCount++;
                if (boundaryCount === 1) marks.plainStart = i;
                else if (boundaryCount === 2) marks.markStart = i;
                else if (boundaryCount === 3) marks.markEnd = i;
            }
        }
    }
    // counter for plaintext lines
    let p0 = Number(marks.plainStart) + 8;
    let p1 = Number(marks.markStart);
    for (let p = p0; p < p1; p++) {
        if (lines[p].trim() === '---------- Forwarded message ---------') {
            p += 4;
        } else {
            let textArray = lines[p].trim().split(' ');
            for (let t in textArray) {
                if (textArray[t]) toReturn.plaintext.add(textArray[t]);
            }
        }
    }
    // counter for markdown lines
    let m0 = Number(marks.markStart) + 4;
    let m1 = Number(marks.markEnd);
    let mdString = "";
    for (let m = m0; m < m1; m++) {
        let mdLine = lines[m];
        if (mdLine.length === 77) {
            mdLine = mdLine.substring(0, 75);
        } else {
            mdLine = mdLine.replace(/\r/, '');
        }
        mdString += mdLine;

    }
    mdString = mdString.replace(/=C2/g, ' ');
    mdString = mdString.replace(/=A0/g, ' ');
    mdString = mdString.replace(/=C2=A0/g, ' ');
    mdString = mdString.replace(/=20/g, ' ');
    mdString = mdString.replace(/=E2=80=93/g, '-');
    mdString = mdString.replace(/=([0-9a-fA-F]{2})/g, (stringmatched, encoded) => {
        const intval = parseInt(encoded, 16);
        return String.fromCharCode(intval);
    });
    let chunks = [];
    if (mdString.includes('<div dir="ltr"')) {
        chunks = mdString.split('<div dir="ltr"');
    }
    let timeOfMail = chunks[chunks.length - 2];
    const dateIndex = timeOfMail.indexOf('<br>Date: ');
    const subjIndex = timeOfMail.indexOf('<br>Subject: ');
    timeOfMail = timeOfMail.substring(dateIndex + 10, subjIndex);
    timeOfMail = timeOfMail.replace(':', ' ');
    let dateParts = timeOfMail.split(' ');
    let year = parseInt(dateParts[3]);
    const months = {
        'Jan': 0,
        'Feb': 1,
        'Mar': 2,
        'Apr': 3,
        'May': 4,
        'Jun': 5,
        'Jul': 6,
        'Aug': 7,
        'Sep': 8,
        'Oct': 9,
        'Nov': 10,
        'Dec': 11
    };
    let month = months[dateParts[1]];
    let day = parseInt(dateParts[2].substring(0, dateParts[2].length - 1));
    let hour = parseInt(dateParts[5]) + ((dateParts[7] === 'PM') ? 12 : 0);
    let minute = parseInt(dateParts[6]);
    let date = new Date();
    date.setFullYear(year);
    date.setMonth(month);
    date.setDate(day);
    date.setHours(hour);
    date.setMinutes(minute);
    toReturn.date.timestamp = date.getTime() + "";
    toReturn.date.year = year;
    toReturn.date.month = dateParts[1];
    toReturn.date.day = day;
    let body = chunks[chunks.length - 1].substring(0, mdString.length - ((chunks.length - 1) * 6));
    toReturn.markdown = body;
    return toReturn;
}