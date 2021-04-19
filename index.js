const searchForm = document.querySelector("#search-form")
const reviewForm = document.querySelector("#review-form")
const resultsUl = document.querySelector("#results-ul")
const videoTitle = document.querySelector("div#review-div h2")
const videoImage = document.querySelector("div#review-div img")
const reviewsList = document.querySelector("#posts-ul")

const URL = "http://localhost:3000/videos"

fetch(URL)
    .then(res => res.json())
    .then(videosArray => {
        videosArray.forEach(videoObject => {
            videoToHTML(videoObject)
        })
    })


function videoToHTML(videoPOJO) {
    let newListItem = document.createElement("li")
    let newThumbnail = document.createElement("img")
    newThumbnail.src = videoPOJO.image

    let newLikesDiv = document.createElement("div")
    let likeBtn = document.createElement('button')
        likeBtn.innerText = "Like"
        likeBtn.addEventListener('click', function(element) {changeLikeCount(element, videoPOJO.id, 'add')})
    let dislikeBtn = document.createElement('button')
        dislikeBtn.innerText = "Dislike"

    let counter = document.createElement("p")
        counter.innerText = videoPOJO.likes
        counter.id = 'counter'
    newLikesDiv.append(dislikeBtn,counter,likeBtn)
    
    newListItem.append(newThumbnail,videoPOJO.title,newLikesDiv)

    reviewsList.append(newListItem)
}

function changeLikeCount(element, objectId, method) {
    console.log(element.path[1].querySelector("#counter").innerText)
    let incrementer
    method === 'add' ? incrementer = 1 : incrementer = -1
    fetch(`${URL}/${objectId}`)
        .then(res => res.json())
        .then(object => {
            let currentCounterValue = object.likes
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
                    //update memory
                    //update dom
                })
        })
}