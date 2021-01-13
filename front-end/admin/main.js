function getLocalStorageWithExpiry(key) {
    const itemStr = window.localStorage.getItem(key)
    // if the item doesn't exist, return null
    if (!itemStr) {
        return undefined
    }
    const item = JSON.parse(itemStr)
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        window.localStorage.removeItem(key)
        return undefined
    }
    return item.value
}

const baseUrl = window.location.origin;
const getUserPostsUrl = baseUrl + "/api/admin/post";
const deletePostUrl = baseUrl + "/api/admin/post/";
const createPostUrl = baseUrl + "/api/admin/post";
const updatePostUrl = baseUrl + "/api/admin/post/";
const user = getLocalStorageWithExpiry('user')

$(document).ready(function() {

    if (user === undefined) {
        window.location.href = '/'
        return;
    }

    $('#user-email-placeholder').html(user.email)


    fetch('http://localhost:1337/api/admin/post/crud/', { 
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + user.token,
            },
            }).then(function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }
                response.text().then(txt =>{
                    let json_obj = JSON.parse(txt);
                    if (json_obj){
                        createAndAppendPosts(json_obj);
                    } else{
                        $("#no-post-alert").removeClass("d-none");
                    }
                })  
            }
            ).catch(function (err) {
                console.log('Fetch Error :-S', err);
            });


    $("#create-post-btn").on('click', function(e) {
        $("#post-form").attr({
            method: "POST",
            action: "", //createPostUrl,
        });
        setModalAttributes("ایجاد پست جدید", "", "")
    });

    $(".edit-post-container").on('click', function(e) {
        $("#post-form").attr({
            method: "PUT",
            action: $(this).data('pid'), //updatePostUrl + $(this).data('pid'),
        });

        $postContainer = $(this).closest(".post-container");
        title = $postContainer.find(".post-title").text();
        content = $postContainer.find(".post-content").text();
        
        setModalAttributes("ویرایش پست", title, content);
    });

    $("#post-form").on('submit', function(e) {
        e.preventDefault();
        //console.log(user.token);
        fetch( 'http://localhost:1337/api/admin/post/crud/' +  $(this).attr('action'), { 
            method: $(this).attr('method'),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + user.token,
            },
            body: JSON.stringify({
                    title: $("#postTitle").val(),
                    content: $("#postContent").val(),
                }),
            })
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' + response.status);
                            return;
                        }
                        window.location.reload();    
                    }
                )
                .catch(function (err) {
                    console.log('Fetch Error :-S', err);
                    $("#form-error-msg").removeClass('d-none').text(error.responseJSON.message);
                });
    });
})

logout = () => {
    window.localStorage.removeItem('user')
    window.location.href = '../index.html'
}

function createAndAppendPosts(posts) {
    $posts = createPostElements(posts);
    $("#posts-container").append($posts);
}

function createPostElements(posts) {
    postsElements = [];

    array_json = posts["post"];
    var i;
    if (!Array.isArray(array_json)){
        array_json = [];
        array_json.push(posts["post"]);
    }
    for (i = 0; i < array_json.length; i++){
        $post = $(".clonable-post").clone(true);
        $post.removeClass('d-none clonable-post');

        $post.find(".post-title").text(array_json[i].title);
        $post.find(".post-content").text(array_json[i].content);
        $post.find(".post-author").text(array_json[i].created_by.id);
        $post.find(".post-created-at").text(formatDate(array_json[i].created_at));
    
        $post.find(".remove-post-container").attr("data-pid", array_json[i].id).on('click', function(e) {
            deletePostRequest($(this).data("pid"), $(this).closest(".post-container"));
        });

        $post.find(".edit-post-container").attr("data-pid", array_json[i].id);
        postsElements.push($post)
    }
    
    return postsElements;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

function deletePostRequest(id, $post) {
    fetch('http://localhost:1337/api/admin/post/crud/' + id, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + user.token,
                },
            }).then(function (response) {
                        if (response.status !== 204) {
                            console.log('Looks like there was a problem. Status Code: ' + response.status);
                            return;
                        }
                        $post.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }
                ).catch(function (err) {
                    console.log('Fetch Error :-S', err);
                });
}

function setModalAttributes(modalTitle, title, content) {
    $("#postTitle").val(title);
    $("#postContent").val(content);
    $("#modalTitle").html(modalTitle);
}
