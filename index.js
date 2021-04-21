const searchForm = document.querySelector("#search-form")
const reviewForm = document.querySelector("#review-form")
const resultsUl = document.querySelector("#results-ul")
const videoInfo = document.querySelector("div#review-div h2")
const videoImage = document.querySelector("div#review-div img")
const postedReviewsDiv = document.querySelector("#posts-div")
const resultsDiv = document.querySelector("#results-container")
const reviewToEnterDiv = document.querySelector("#review-div")
const titleOfVideoToReview = document.querySelector("#videoToReviewTitle")
const imageOfVideoToReview = document.querySelector("#videoToReviewImage")

const databaseURL = "http://localhost:3000/videos"
const YTURL = "https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=video&q="
const linkToYTVideo = 'https://www.youtube.com/watch?v='

let localDatabase = {}
const API_KEY = config.MY_SECRET_API_KEY

fetch(databaseURL)
    .then(res => res.json())
    .then(videosArray => {
        videosArray.forEach(videoObject => {
            localDatabase[videoObject.id] = videoObject
            videoObjectToHTML(videoObject)
        })
    })

searchForm.addEventListener('submit', function(event){
    event.preventDefault()
    let queryText = event.target['search-query'].value
    processSearch(queryText)
})

function processSearch(queryText) {
    fetch(`${YTURL}${queryText}&key=${API_KEY}`)
        .then(res => res.json())
        .then(resultsObject => {
            resultsDiv.style.display = 'block'
            resultsObject.items.forEach(resultObject => {
                let videoId = resultObject.id.videoId
                let {channelTitle, title} = resultObject.snippet
                let thumbnailUrl = resultObject.snippet.thumbnails.default.url

                let newResultLi = document.createElement('li')
                let newResultThumbnail = document.createElement('img')
                    newResultThumbnail.src = thumbnailUrl
                let newResultLink = document.createElement("a")
                    newResultLink.href = linkToYTVideo+videoId
                    newResultLink.target = "_blank"
                newResultLink.append(newResultThumbnail)

                let newResultTitle = document.createElement('p')
                    newResultTitle.innerText = title
                let newResultButton = document.createElement('button')
                    newResultButton.innerText = 'Select'
                    newResultButton.addEventListener('click', function(){
                        searchForm.reset()
                        populateReviewForm(thumbnailUrl,title,videoId,channelTitle)
                    })
                newResultLi.append(newResultLink,newResultTitle,newResultButton)

                resultsUl.append(newResultLi)
            })
        })
}

function populateReviewForm(thumbnailString, titleString,videoIdString,channelIdString) {
    resultsDiv.style.display = 'None'
    reviewToEnterDiv.style.display = 'inline-block'
    titleOfVideoToReview.innerText = titleString
    imageOfVideoToReview.src = thumbnailString
    reviewForm.addEventListener('submit', function(event){
        event.preventDefault()
        let newVideoPOJO = {
            "title": titleString,
            "channel": channelIdString,
            "videoId": linkToYTVideo+videoIdString,
            "image": thumbnailString,
            "likes": 0,
            "reviews": [event.target["review-input"].value]
            }
        postVideoPOJO(newVideoPOJO)
    })
}

function postVideoPOJO(videoObject) {
    let postConfig = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(videoObject)
    }
    fetch(databaseURL, postConfig)
        .then(res => res.json())
        .then(postedObject => {
            localDatabase[postedObject.id] = postedObject
            videoObjectToHTML(postedObject)
            reviewToEnterDiv.style.display = 'none'
        })
}

function videoObjectToHTML(videoPOJO) {
    let newThumbnail = document.createElement("img")
        newThumbnail.src = videoPOJO.image
    let newVideoLink = document.createElement("a")
        newVideoLink.href = linkToYTVideo+videoPOJO.videoId
        newVideoLink.target = "_blank"
        newVideoLink.append(newThumbnail)
    
    let newLikesDiv = document.createElement("div")
        newLikesDiv.className = "likes-div"
    
    let likeBtn = document.createElement('button')
        likeBtn.innerText = "Like"
        likeBtn.value = 'false'
        likeBtn.addEventListener('click', function(event) {changeLikeCount(event, videoPOJO.id, 'add')})
    let dislikeBtn = document.createElement('button')
        dislikeBtn.innerText = "Dislike"
        dislikeBtn.value = 'false'
        dislikeBtn.addEventListener('click', function(event) {changeLikeCount(event, videoPOJO.id, 'subtract')})
    let counter = document.createElement("p")
        counter.innerText = videoPOJO.likes
        counter.id = 'counter'
    
    newLikesDiv.append(likeBtn, counter, dislikeBtn)
    
    let videoInfo = document.createElement('div')
    
    let videoTitle = document.createElement('h3')
    videoTitle.innerText = videoPOJO.title
    let videoReview = document.createElement('p')
    videoReview.innerText = videoPOJO.reviews[0]
    
    videoInfo.append(videoTitle, videoReview)
    
    let newVideoDiv = document.createElement("div")
        newVideoDiv.append(newVideoLink, videoInfo, newLikesDiv)

    postedReviewsDiv.append(newVideoDiv)
}

function changeLikeCount(event, objectId, method) {
    let button = event.path[0]
    button.disabled = 'true'
    button.value === 'true'? button.value = 'false' : button.value = 'true'

    let incrementer
    (method === 'add' && button.value === 'true' || method === 'subtract' && button.value === 'false') ? incrementer = 1 : incrementer = -1

    let currentCounterValue = localDatabase[objectId].likes
    let newCounterValue = currentCounterValue + incrementer

    let patchConfig = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"likes": newCounterValue})
    }
    fetch(`${URL}/${objectId}`, patchConfig)
        .then(res => res.json())
        .then(updatedObject => {
            localDatabase[updatedObject.id].likes = updatedObject.likes
            event.path[1].querySelector("#counter").innerText = localDatabase[updatedObject.id].likes
            button.disabled = false
        })
        .catch(error => {
            console.log(error)
            button.disabled = false
        })
}