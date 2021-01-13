function setLocalStorageWithExpiry(key, value, ttl) {
    const now = new Date()
    
	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}
	window.localStorage.setItem(key, JSON.stringify(item))
}

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

showLoggedInButtons = () => {
    $('#login-btn').hide()
    $('#register-btn').hide()
    $('#logout-btn').show()
    $('#admin-btn').show()
    $('#user-info').html(`
    <hr>
    <h4><i class="fal fa-user"></i> خوش آمدید
    ${getLocalStorageWithExpiry('user').email}
    </h4>
    `)
}

showLoggedOutButtons = () => {
    $('#login-btn').show()
    $('#register-btn').show()
    $('#logout-btn').hide()
    $('#admin-btn').hide()
    $('#user-info').html('')
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
    for (i = 0; i < length(array_json); i++){
        $post = $(".clonable-post").clone(true);
        $post.removeClass('d-none clonable-post');

        $post.find(".post-title").text(array_json[i].title);
        $post.find(".post-content").text(array_json[i].content);
        $post.find(".post-author").text(array_json[i].created_by.id);
        $post.find(".post-created-at").text(formatDate(array_json[i].created_at));
    
        postsElements.push($post)
    }
    // for (post of posts) {
    //     $post = $(".clonable-post").clone(true);
    //     $post.removeClass('d-none clonable-post');

    //     $post.find(".post-title").text(post.title);
    //     $post.find(".post-content").text(post.content);
    //     $post.find(".post-author").text(post.user.email);
    //     $post.find(".post-created-at").text(formatDate(post.createdAt));

    //     postsElements.push($post)
    // }
    
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

jQuery(document).ready(function ($) {
    $.ajax({
        url: window.location.origin + '/api/post',
        method: 'GET',
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

    const $sidebar = $("#sidebar");
    const $menuToggleBtn = $("#toggle-menu-btn");

    $menuToggleBtn.on('click', function () {
        $sidebar.trigger('menu:toggle');
        $menuToggleBtn.toggleClass('fa-times', 'fa-bars');
    });

    $sidebar.on('menu:toggle', function () {
        if ($menuToggleBtn.hasClass('fa-times')) {
            $sidebar.trigger('menu:close');
        } else {
            $sidebar.trigger('menu:open');
        }
    }).on('menu:open', function () {
        $sidebar.addClass('open-sidebar');
    }).on('menu:close', function () {
        $sidebar.removeClass('open-sidebar');
    });

    if (getLocalStorageWithExpiry('user') === undefined) {
        showLoggedOutButtons()
    } else {
        showLoggedInButtons()
    }
});

// Modal
function openModal(state) {
    $(`#${state}-tab-btn`).click()
    document.getElementById('modal').classList.add('active-modal');
}
function closeModal() {
    document.getElementById('modal').classList.remove('active-modal');
    $('#dismiss-alert').click()
}

showLoginAlert = (message, style='danger') => {
    $('#alert-zone').html(`
        <div id="login-alert" class="alert alert-${style} alert-dismissible fade show mx-auto" style="display:none;" role="alert">
            <button id="dismiss-alert" type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            ${message}
        </div>
    `);

    $('#login-alert').slideDown("fast");
}

openAdmin = () => {
    window.location.href = './admin/index.html'
}

logout = () => {
    window.localStorage.removeItem('user')
    showLoggedOutButtons()
}

login = () => {
    const emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    let email = $('#login-email-input').val();
    let password = $('#login-password-input').val();

    if (email == '') {
        showLoginAlert('لطفا ایمیل خود را وارد کنید!')
        return;
    }

    if (!emailReg.test(email)) {
        showLoginAlert('لطفا یک ایمیل متعبر وارد کنید!')
        return;
    }

    if (password == '') {
        showLoginAlert('لطفا رمز عبور خود را وارد کنید!')
        return;
    }

    $('#dismiss-alert').click();


    fetch('http://localhost:1337/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                            "email": email,
                            "password": password
                        }),
            })
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' + response.status);
                            
                            return;
                        }
                        response.text().then(txt =>
                            console.log(txt));
                            //todo: handle the fuckin token
                            const token = "a";     //response.token
                            setLocalStorageWithExpiry('user', {
                                token: token,
                                email: response.email
                            }, 3600000)
                            showLoginAlert('Login successful', 'success');
                            showLoggedInButtons();
                            closeModal();
                    }
                )
                .catch(function (err) {
                    console.log('Fetch Error :-S', err);
                });

}

registerDone = (response) => {
    $('#login-tab-btn').click()
    showLoginAlert(response.message, 'success')
}

register = () => {
    const emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    let email = $('#register-email-input').val();
    let password = $('#register-password-input').val();
    let repeatPassword = $('#register-repeat-password-input').val();
    let acceptRules = $('#register-accept-rules').prop('checked');
    
    if (email == '') {
        showLoginAlert('لطفا ایمیل خود را وارد کنید!')
        return;
    }

    if (!emailReg.test(email)) {
        showLoginAlert('لطفا یک ایمیل متعبر وارد کنید!')
        return;
    }

    if (password == '') {
        showLoginAlert('لطفا رمز عبور خود را وارد کنید!')
        return;
    }

    if (password != repeatPassword) {
        showLoginAlert('رمز عبور و تکرار آن مطابقت ندارند!')
        return;
    }

    if (!acceptRules) {
        showLoginAlert('برای عضویت، قوانین و شرایط را بپذیرید!')
        return;
    }

    $('#dismiss-alert').click();

    fetch('http://localhost:1337/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                            "email": email,
                            "password": password
                        }),
            })
                .then(
                    function (response) {
                        if (response.status !== 201) {
                            console.log('Looks like there was a problem. Status Code: ' + response.status);
                            return;
                        }
                        response.text().then(txt =>
                            console.log(txt));
                    }
                )
                .catch(function (err) {
                    console.log('Fetch Error :-S', err);
                });

}
