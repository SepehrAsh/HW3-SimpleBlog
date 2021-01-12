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

    $.ajax({
        url: getUserPostsUrl,
        method: 'GET',
        headers: {
            "Authorization": user.token,
        },
        success: function (response) {
            if (response.length)
                createAndAppendPosts(response);
            else
                $("#no-post-alert").removeClass("d-none");
            
        },
        error: function (error) {
            console.log(error)
        }
    });

    $("#create-post-btn").on('click', function(e) {
        $("#post-form").attr({
            method: "POST",
            action: createPostUrl,
        });
        setModalAttributes("ایجاد پست جدید", "", "")
    });

    $(".edit-post-container").on('click', function(e) {
        $("#post-form").attr({
            method: "PUT",
            action: updatePostUrl + $(this).data('pid'),
        });

        $postContainer = $(this).closest(".post-container");
        title = $postContainer.find(".post-title").text();
        content = $postContainer.find(".post-content").text();
        
        setModalAttributes("ویرایش پست", title, content);
    });

    $("#post-form").on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            method: $(this).attr('method'),
            url: $(this).attr('action'),
            data: {
                title: $("#postTitle").val(),
                content: $("#postContent").val(),
            },
            headers: {
                "Authorization": user.token,
            },
            success: function (response) {
                window.location.reload();
            },
            error: function (error) {
                $("#form-error-msg").removeClass('d-none').text(error.responseJSON.message);
            }
        });
    });
})

logout = () => {
    window.localStorage.removeItem('user')
    window.location.href = '/'
}

function createAndAppendPosts(posts) {
    $posts = createPostElements(posts);
    $("#posts-container").append($posts);
}

function createPostElements(posts) {
    postsElements = [];

    for (post of posts) {
        $post = $(".clonable-post").clone(true);
        $post.removeClass('d-none clonable-post');

        $post.find(".post-title").text(post.title);
        $post.find(".post-content").text(post.content);
        $post.find(".post-author").text(post.user.email);
        $post.find(".post-created-at").text(formatDate(post.createdAt));

        $post.find(".remove-post-container").attr("data-pid", post.id).on('click', function(e) {
            deletePostRequest($(this).data("pid"), $(this).closest(".post-container"));
        });

        $post.find(".edit-post-container").attr("data-pid", post.id);

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
    $.ajax({
        url: deletePostUrl + id,
        method: "DELETE",
        headers: {
            "Authorization": user.token,
        },
        success: function (response) {
            $post.fadeOut(300, function() {
                $(this).remove();
            });
        },
        error: function (error) {
            console.log(error)
        }
    });
}

function setModalAttributes(modalTitle, title, content) {
    $("#postTitle").val(title);
    $("#postContent").val(content);
    $("#modalTitle").html(modalTitle);
}
