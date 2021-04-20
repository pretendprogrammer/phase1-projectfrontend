const searchForm = document.querySelector("#search-form")
const reviewForm = document.querySelector("#review-form")
const resultsUl = document.querySelector("#results-ul")
const videoInfo = document.querySelector("div#review-div h2")
const videoImage = document.querySelector("div#review-div img")
const reviewsDiv = document.querySelector("#posts-div")

const URL = "http://localhost:3000/videos"

let localDatabase = {}

fetch(URL)
    .then(res => res.json())
    .then(videosArray => {
        videosArray.forEach(videoObject => {
            localDatabase[videoObject.id] = videoObject
            videoToHTML(videoObject)
        })
    })


function videoToHTML(videoPOJO) {
    let newVideoDiv = document.createElement("div")
    let newThumbnail = document.createElement("img")
    newThumbnail.src = videoPOJO.image

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
    
    newVideoDiv.append(newThumbnail, videoInfo, newLikesDiv)

    reviewsDiv.append(newVideoDiv)
}

function changeLikeCount(event, objectId, method) {
    let button = event.path[0]
    button.disabled = 'true'
    button.value === 'true'? button.value = 'false' : button.value = 'true'

    let incrementer
    (method === 'add' && button.value === 'true' || method === 'subtract' && button.value === 'false') ? incrementer = 1 : incrementer = -1

    let currentCounterValue = localDatabase[objectId].likes
    let newCounterValue = currentCounterValue + incrementer

    let config = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"likes": newCounterValue})
    }
    fetch(`${URL}/${objectId}`, config)
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