const https = require('https');
const cheerio = require('cheerio');
const fs = require("fs");
var stringify = require('csv-stringify');
var page = "";

//excat original web-page code
https.get('https://issues.apache.org/jira/browse/CAMEL-10597', function(res) {
    // console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
    res.on('data', function(d) {
        page += d;
    });

    res.on('end', function () {
        var $ = cheerio.load(page);
        // var $ = cheerio.load(data);

        // 1. extract "Details" data
        var issuedDetails = $('#issuedetails li');
        var customFieldModule = $('#customfieldmodule li');
        var details_keys = [];
        var details_values = [];

        $(issuedDetails).each(function (index, item) {
            var raw_key = $(item).find("strong").text();
            var key = raw_key.replace(/:/, "");
            var raw_val = $($(item).find(".wrap span")[0]).text();
            var val = raw_val.replace(/^\s*/, "").replace(/\s*$/, "");
            details_keys.push(key);
            details_values.push(val)
        });

        $(customFieldModule).each(function (index, item) {
            var raw_key = $(item).find("strong").text();
            var key = raw_key.replace(/:/, "");
            var raw_val = $($(item).find(".wrap div")[0]).text();
            var val = raw_val.replace(/^\s*/, "").replace(/\s*$/, "");
            details_keys.push(key);
            details_values.push(val)
        });
        // console.log(details_keys);
        // console.log(details_values);
        
        
         // 2. exact "People" data
        var people = $('#peoplemodule dl');
        var people_keys = [];
        var people_values = [];
        $(people).each(function (index, item) {
            var raw_key = $(item).find("dt").text();
            var key = raw_key.replace(/:/, "");
            var raw_val = $(item).find("dd").text();
            var val = raw_val.replace(/^\s*/, "").replace(/\s*$/, "");
            people_keys.push(key);
            people_values.push(val)
        });
        // console.log(people_keys);
        // console.log(people_values)


        // 3. exact "Dates" data
        var date = $("#datesmodule ul li dl");
        var date_keys = [];
        var date_values = [];
        $(date).each(function (index, item) {
            var raw_key = $(item).find("dt").text();
            var key = raw_key.replace(/:/, "");
            var date_time = $(item).find("dd time").attr("datetime");
            date_keys.push(key);
            date_values.push(date_time);
            var epoch_key = key + "_Epoch";
            var epoch = getEpoch(date_time);
            date_keys.push(epoch_key);
            date_values.push(epoch);
        });
        // console.log(date_keys);
        // console.log(date_values);


        // 4. exact "Description" data
        var description_keys = [];
        var description_values = [];
        description_keys.push($("#descriptionmodule_heading h2").text());
        description_values.push($("#description-val").text().trim());
        // console.log(description_keys);
        // console.log(description_values);


        // 5. excat "Comments" data
        var comments = $("#issue_actions_container>div");
        var comments_keys = [];
        var comments_values = [];
        var comments_slice = [];
        $(comments).each(function (index, item) {
            var author = $(item).find(".action-details > a").eq(0).text().trim();
            var date_time = $(item).find(".action-details time").attr("datetime");
            var epoch = getEpoch(date_time);
            var date_time_text = $(item).find(".action-details time").eq(0).text().trim();
            var comment_body = $(item).find(".action-body").text().trim();
            var str = author + ":" + epoch + ":" + date_time_text + ":" + comment_body;
            comments_slice.push(str)
        });
        comments_keys.push("Comments");
        comments_values.push(comments_slice.join(";\n\n"));
        // console.log(comments_keys);
        // console.log(comments_values);

        var keys = details_keys.concat(people_keys, date_keys, description_keys, comments_keys);
        var vals = details_values.concat(people_values, date_values, description_values, comments_values);
        // console.log(keys);
        // console.log(vals);

//output  .csv fiel
        var input = [];
        input.push(keys);
        input.push(vals);
        stringify(input, function(err, output){
            fs.writeFile('output.csv', output,  function(err) {
                if (err) {
                    return console.error(err);
                }
            });
        });

        fs.writeFile('page.html', page,  function(err) {
            if (err) {
                return console.error(err);
            }
        });

    });
}).on('error', function(e) {
    console.error(e);
});


function getEpoch(time){
    time = time || "1970-01-01T00:00:00+0000";
    var timestamp = Date.parse(new Date(time));
    var epoch = timestamp / 1000;
    return epoch
}
        
        
        
        