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

// INITIAL FETCH TO POPULATE FROM EXISTING DATABASE
fetch(databaseURL)
    .then(res => res.json())
    .then(videosArray => {
        videosArray.forEach(videoObject => {
            localDatabase[videoObject.id] = videoObject
            turnVideoObjectToHTML(videoObject) // CALL FUNCTION TO ADD TO DOM
        })
    })

// ADD LISTNER TO SUBMIT BUTTON
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
function populateReviewForm(thumbnailString, titleString, videoIdString, channelIdString, method, videoIdNum, reviewElement) {
    resultsDiv.style.display = 'None'
    reviewToEnterDiv.style.display = 'flex'
    titleOfVideoToReview.innerText = titleString
    imageOfVideoToReview.src = thumbnailString
    method === 'update' ? reviewForm['review-input'].value = reviewElement.innerText : reviewForm['review-input'].value = ''
    reviewForm.addEventListener('submit', function(event){
        event.preventDefault()
        if (method === 'update') { // MODIFY EXISTING REVIEW
            let patchConfig = {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({"reviews": [event.target["review-input"].value]})
            }
            fetch(`${databaseURL}/${videoIdNum}`, patchConfig)
                .then(res => res.json())
                .then(updatedObject => {
                    localDatabase[videoIdNum].reviews = updatedObject.reviews
                    reviewElement.innerText = updatedObject.reviews[0]
                    reviewForm.reset()
                    reviewToEnterDiv.style.display = 'none'
                })
        } else if (method === 'add') { // ADD NEW REVIEW
            let patchConfig = {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({"reviews": [...localDatabase[videoIdNum].reviews, event.target["review-input"].value]})
            }
            fetch(`${databaseURL}/${videoIdNum}`, patchConfig)
                .then(res => res.json())
                .then(updatedObject => {
                    localDatabase[videoIdNum].reviews = updatedObject.reviews
                    reviewForm.reset()
                    reviewToEnterDiv.style.display = 'none'
                    addReviewToExpandedView(localDatabase[videoIdNum].reviews[localDatabase[videoIdNum].reviews.length -1])
                })
        } else { // MAKE FIRST REVIEW
            let newVideoPOJO = {
                "title": titleString,
                "channel": channelIdString,
                "videoId": videoIdString,
                "image": thumbnailString,
                "likes": 0,
                "reviews": [event.target["review-input"].value]
                }
            postVideoPOJO(newVideoPOJO)
        }
    })
}

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

// CREATE VISUAL ELEMENTS FROM OBJECSTS OF VIDEO INFORMATION
function turnVideoObjectToHTML(videoPOJO) {
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
        videoReview.className = "review-p"
        videoReview.addEventListener('click', function(){
            openExpandedView(videoPOJO)
        })

    let videoUpdateButton = document.createElement('button')
        videoUpdateButton.innerText = "Update"
        videoUpdateButton.className = "review-mod-btn"  
        videoUpdateButton.addEventListener('click', function(){
            populateReviewForm(videoPOJO.image, videoPOJO.title, videoPOJO.videoId, videoPOJO.channel, 'update', videoPOJO.id, videoReview)
        })

    let videoDeleteButton = document.createElement('button')
        videoDeleteButton.innerText = "Delete"
        videoDeleteButton.className = "review-mod-btn"  
        videoDeleteButton.addEventListener('click', function(e){
            e.preventDefault();
            deleteVideoObject(videoPOJO.id, videoReview)
        })
    
    let updateAndDeleteDiv = document.createElement('div')
    updateAndDeleteDiv.append(videoUpdateButton, videoDeleteButton)    
    videoInfo.append(videoTitle, videoReview, updateAndDeleteDiv)
    
    let newVideoDiv = document.createElement("div")
        newVideoDiv.append(newVideoLink, videoInfo, newLikesDiv)

    postedReviewsDiv.append(newVideoDiv)
}

// ADD NEW REVIEW TO VIDEO IN EXPANDED VIEW
function addReviewToExpandedView(reviewString) {
    let reviewLi = document.createElement("li")
        reviewLi.innerText = reviewString
    expandedViewDiv.querySelector("ul").append(reviewLi)
}

// BRING A VIDEO TO EXPANDED VIEW
function openExpandedView(videoPOJO) {
    if (isExpandedViewOpen) {return}
    isExpandedViewOpen = true

    expandedViewDiv.style.display = "flex"
    YTiframe.src = `https://www.youtube.com/embed/${videoPOJO.videoId}`
    videoPOJO.reviews.forEach(reviewString => {
        addReviewToExpandedView(reviewString)
    })
    addReviewButton.addEventListener('click', () => { // LISTENER TO ADD A NEW REVIEW
        populateReviewForm(videoPOJO.image, videoPOJO.title, videoPOJO.videoId, videoPOJO.channel, 'add', videoPOJO.id)
    })
    closeExpandedViewButton.addEventListener('click', () => { // LISTNER TO CLOSE EXPANDED VIEW
        reviewForm.reset()
        reviewForm.style.display = 'none'
        YTiframe.src = ''
        expandedViewDiv.querySelector("ul").innerText = ''
        expandedViewDiv.style.display = 'none'
        isExpandedViewOpen = false
    })
}

 // DELETE A REVIEW
function deleteVideoObject(videoIdNum, videoReviewP) {

  let deleteConfig = {
    method: "DELETE"
}
    console.log(`${databaseURL}/${videoIdNum}`)
  fetch(`${databaseURL}/${videoIdNum}`, deleteConfig)
      .then(res => res.json())
      .then(updatedObject => {
        console.log(updatedObject)
        // videoReviewP.innerText = " "
        // localDatabase[videoIdNum].reviews = ['']
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
            event.path[1].querySelector("#counter").innerText = localDatabase[updatedObject.id].likes
            button.disabled = false
        })
        .catch(error => {
            console.log(error)
            button.disabled = false
        })
}

