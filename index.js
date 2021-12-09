const express = require('express');
const request = require('request');
const stories = require('./stories');
const path = require('path');

const app = express();

//when you type localhost:3000/ping it will repson back pong
app.get('/ping', (req, res) => {
    res.send('pong!');
});


// display in terminal/consol what being requested
app.use((req, res, next) => {
    console.log('Request details. Method:', req.method, 'Original url:', req.originalUrl );
    next();
});

//header method should now accept any URL which we can do with the * argument.
// if you want to only work on specific website change the to the website you want
app.use((req, res, next ) => { 
    res.header('Access-Conrol-Allow-Origin', '*');
    next();
});

app.use(express.static(path.join(__dirname, 'client/dist')));

//display all stories in storeis.json
app.get('/stories', (req, res) => {
    res.json(stories);
});

//display stories only from the title put in
app.get('/stories/:title', (req, res) => {
    const { title } = req.params;
    res.json(stories.filter(story => story.title.includes(title)));
});

//use api to find top stories
app.get('/topstories', (req, res, next) => { 
    request(
        {url: 'https://hacker-news.firebaseio.com/v0/topstories.json'},
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                console.log('going to next');
                return next(new Error('Error requesting story item'));
            }
            const topStories = JSON.parse(body);
            const limit = 10;
            // promise.all prevent all the empty arrays
            // since promise.all place the entire top stories that slice within the promise  
            Promise.all(
                topStories.slice(0,limit).map (story => {
                    // need promise prevent nulls to appear
                    return new Promise ((resolve, reject)=> {
                        request(
                            {url: `https://hacker-news.firebaseio.com/v0/item/${story}.json`},
                            (error, response, body) => {
                                if (error || response.statusCode !== 200) {
                                    return reject(new Error('Error requesting story item'));
                                  }
                    
                                resolve( JSON.parse(body));
                            }
                        );
                    })
                })
            )
            .then(fullTopStories => {
                res.json(fullTopStories);
            })
            .catch(error => next(error));
        }
    )
});

const PORT = 3000;
app.listen(PORT, () => console.log (`listening on ${PORT}`));