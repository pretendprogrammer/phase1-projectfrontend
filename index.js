// STABLE ELEMENT DECLARATIONS
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
const YTiframe = document.querySelector("iframe")
const expandedViewDiv = document.querySelector("#expanded-view-div")
const addReviewButton = document.querySelector("#add-review-btn")
const closeExpandedViewButton = document.querySelector("#close-expanded-view-btn")

// OTHER VARIABLES
const databaseURL = "http://localhost:3000/videos"
const YTURL = "https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=video&q="
const linkToYTVideo = 'https://www.youtube.com/watch?v='
let localDatabase = {}
const API_KEY = config.MY_SECRET_API_KEY
let isExpandedViewOpen
let reviewArgumentsArray = []

// INITIAL FETCH TO POPULATE FROM EXISTING DATABASE
function initialFetch() {
    fetch(databaseURL)
        .then(res => res.json())
        .then(videosArray => {
            videosArray.forEach(videoObject => {
                localDatabase[videoObject.id] = videoObject
                turnVideoObjectToHTML(videoObject) // CALL FUNCTION TO ADD TO DOM
            })
        })
}

// ADD LISTNER TO SUBMIT BUTTON TO SEARCH FOR A VIDEO
searchForm.addEventListener('submit', function(event){
    event.preventDefault()
    let queryText = event.target['search-query'].value
    processSearch(queryText)
})

// USE YOUTUBE'S API TO SEARCH FOR TOP 5 RESULTS AND DISPLAY THEM TO THE DOM
function processSearch(queryText) {
    fetch(`${YTURL}${queryText}&key=${API_KEY}`)
        .then(res => res.json())
        .then(resultsObject => {
            resultsUl.innerText = ''
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

// UPON SELECTION, BRING CHOSEN VIDEO INTO FORM ON THE DOM, ADD LISTENERS TO:
function populateReviewForm(thumbnailString, titleString, videoIdString, channelIdString, method, videoIdNum) {
    resultsDiv.style.display = 'None'
    reviewToEnterDiv.style.display = 'flex'
    titleOfVideoToReview.innerText = titleString
    imageOfVideoToReview.src = thumbnailString
    reviewArgumentsArray = [thumbnailString, titleString, videoIdString, channelIdString, method, videoIdNum]
}

// LISTNER TO SUBMIT EVENT ON REVIEW FORM
reviewForm.addEventListener('submit', function(event){
    event.preventDefault()
    if (reviewArgumentsArray[4] === 'add') { // ADD NEW REVIEW
        let patchConfig = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({"reviews": [...localDatabase[reviewArgumentsArray[5]].reviews, event.target["review-input"].value]})
        }
        fetch(`${databaseURL}/${reviewArgumentsArray[5]}`, patchConfig)
            .then(res => res.json())
            .then(updatedObject => {
                localDatabase[reviewArgumentsArray[5]].reviews = updatedObject.reviews
                reviewForm.reset()
                reviewToEnterDiv.style.display = 'none'
                addReviewToExpandedView(localDatabase[reviewArgumentsArray[5]].reviews[localDatabase[reviewArgumentsArray[5]].reviews.length -1],null,reviewArgumentsArray[5])
            })
    } else { // MAKE FIRST REVIEW
        let newVideoPOJO = {
            "title": reviewArgumentsArray[1],
            "channel": reviewArgumentsArray[3],
            "videoID": reviewArgumentsArray[2],
            "image": reviewArgumentsArray[0],
            "likes": 0,
            "reviews": [event.target["review-input"].value]
            }
        postVideoPOJO(newVideoPOJO)
    }
})

//FUNCTION TO ADD VIDEO TO BACKEND, MEMORY, AND DOM
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
        turnVideoObjectToHTML(postedObject)
        reviewToEnterDiv.style.display = 'none'
    })
}

// CREATE VISUAL ELEMENTS FROM OBJECTS OF VIDEO INFORMATION
function turnVideoObjectToHTML(videoPOJO) {
    let newVideoDiv = document.createElement("div") // CREATE MASTER DIV
        newVideoDiv.dataset.id = videoPOJO.id

    let newThumbnail = document.createElement("img")
        newThumbnail.src = videoPOJO.image
    let newVideoLink = document.createElement("a")
        newVideoLink.href = linkToYTVideo+videoPOJO.videoID
        newVideoLink.target = "_blank"
        newVideoLink.append(newThumbnail)

    let newLikesDiv = document.createElement("div")
        newLikesDiv.className = "likes-div"
    
    let likeBtn = document.createElement('button')
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up fa-lg"></i>'
        likeBtn.value = 'false'
        likeBtn.addEventListener('click', function(event) {
          counter.className = "record-playing-animation"
          changeLikeCount(event, videoPOJO.id, 'add')
        })
    let dislikeBtn = document.createElement('button')
        dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down fa-lg"></i>'
        dislikeBtn.value = 'false'
        dislikeBtn.addEventListener('click', function(event) {
          counter.className = "record-playing-animation"
          changeLikeCount(event, videoPOJO.id, 'subtract')
        })
    let likeOrDislikeBtnDiv = document.createElement('div')
        likeOrDislikeBtnDiv.id = "like-or-dislike-btn-div"
        likeOrDislikeBtnDiv.append(likeBtn, dislikeBtn)    
    let counter = document.createElement("p")
        counter.innerText = videoPOJO.likes
        counter.id = 'counter'
    
    newLikesDiv.append(counter, likeOrDislikeBtnDiv)
    
    let videoInfo = document.createElement('div')
    
    let clickMeText = document.createElement('p')
    clickMeText.className = "click-txt"
    clickMeText.innerHTML = '<i class="far fa-hand-point-up"></i> click above to add a review! <i class="far fa-hand-point-up"></i>' 

    let videoTitle = document.createElement('h3')
        videoTitle.innerText = videoPOJO.title

    let videoReview = document.createElement('p')
        videoReview.innerText = videoPOJO.reviews[0]
        videoReview.className = "review-p"
        videoReview.addEventListener('click', function(){
            openExpandedView(videoPOJO, newVideoDiv)
        })

    let videoDeleteButton = document.createElement('button')
        videoDeleteButton.innerText = "Delete"
        videoDeleteButton.className = "review-mod-btn"  
        videoDeleteButton.addEventListener('click', function(e){
            e.preventDefault();
            deleteVideoObject(videoPOJO.id)
        })
    
    let updateDiv = document.createElement('div')
    updateDiv.append(videoDeleteButton)    
    videoInfo.append(videoTitle, videoReview, clickMeText, updateDiv)
    
    newVideoDiv.append(newVideoLink, videoInfo, newLikesDiv) // ADD SUB-ELEMENTS TO MASTER DIV

    postedReviewsDiv.append(newVideoDiv)
}

// ADD NEW REVIEW TO VIDEO IN EXPANDED VIEW
function addReviewToExpandedView(reviewString, reviewIndexNum, objectIdNum) {
    let reviewLi = document.createElement("li") // CREATE MASTER REVIEW <LI>

    let deleteReviewButton = document.createElement('button')
        deleteReviewButton.innerText = 'Delete'
        deleteReviewButton.dataset.id = reviewIndexNum
        deleteReviewButton.className = 'review-delete-btn'
        deleteReviewButton.addEventListener('click', () => {
            deleteVideoReview(objectIdNum, reviewIndexNum, reviewLi)
        })

    reviewLi.append(`${reviewString} `, deleteReviewButton) // ADD ELEMENTS TO MASTER REVIEW <LI>

    expandedViewDiv.querySelector("ul").append(reviewLi)
    newArray = [...localDatabase[objectIdNum].reviews]
    newArray.push(reviewString)
}

// BRING A VIDEO TO EXPANDED VIEW
function openExpandedView(videoPOJO, videoDiv) {
    if (isExpandedViewOpen) {return}
    isExpandedViewOpen = true

    expandedViewDiv.style.display = "flex"
    YTiframe.src = `https://www.youtube.com/embed/${videoPOJO.videoID}`
    videoPOJO.reviews.forEach((reviewString, indexNum) => {
        addReviewToExpandedView(reviewString, indexNum, videoPOJO.id, videoDiv)
    })
    addReviewButton.addEventListener('click', () => { // LISTENER TO ADD A NEW REVIEW
        populateReviewForm(videoPOJO.image, videoPOJO.title, videoPOJO.videoID, videoPOJO.channel, 'add', videoPOJO.id)
    })
    closeExpandedViewButton.addEventListener('click', () => { // LISTENER TO CLOSE EXPANDED VIEW
        reviewForm.reset()
        reviewForm.style.display = 'none'
        YTiframe.src = ''
        expandedViewDiv.querySelector("ul").innerText = ''
        expandedViewDiv.style.display = 'none'
        isExpandedViewOpen = false
    })
}

 // DELETE A VIDEO OBJECT
function deleteVideoObject(videoIdNum) {
    setTimeout(() => fetch(`${databaseURL}/${videoIdNum}`, {method: "DELETE"})
    .then(function() {
        delete localDatabase[videoIdNum];
        document.querySelector(`div[data-id="${videoIdNum}"]`).remove()
  }), 250)
    
}

 // DELETE A REVIEW
 function deleteVideoReview(objectIdNum, reviewIndexNum, reviewLiElement) {
    let newArray = [...localDatabase[objectIdNum].reviews]
    newArray.splice(reviewIndexNum, 1)
    let patchConfig = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({reviews: newArray}),
    }
    fetch(`${databaseURL}/${objectIdNum}`, patchConfig)
        .then(res => res.json())
        .then(updatedObject => {
            if (updatedObject.reviews.length === 0) {
                deleteVideoObject(objectIdNum)
                reviewLiElement.remove()
                // videoDivElement.remove()
                expandedViewDiv.style.display = 'none'
                isExpandedViewOpen = false
            } else {
                localDatabase[objectIdNum].reviews = updatedObject.reviews
                reviewLiElement.remove()
            }
        })
  }

 // TOGGLE LIKE/DISLIKE BUTTONS, UPDATE BACKEND AND MEMORY
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
    fetch(`${databaseURL}/${objectId}`, patchConfig)
        .then(res => res.json())
        .then(updatedObject => {
            localDatabase[updatedObject.id].likes = updatedObject.likes
            event.path[3].querySelector("#counter").innerText = localDatabase[updatedObject.id].likes
            button.disabled = false
        })
        .catch(error => {
            console.log(error)
            button.disabled = false
        })
}


initialFetch()