const gsapInitialization = () => {

    gsap.registerPlugin(ScrollTrigger);

    // Initalizing custom easing function to match smoothing with Fullpage JS
    gsap.config({
        easeInOutCubic: function (progress) {
            return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
    });

    let sectionEase = "power3.easeinOut";
    let slideEase = "power3.easeinOut";
    let otherAnimationEase = "easeInOutCubic";

    let sectionDuration = 0.8;
    let slideDuration = 0.7;

    let animInprogress = false;
    let animTimeStamp, animTimeStamp2;

    // VodaMedia Development Page Specific GSAP Animation
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);
    gsap.registerPlugin(Observer);

    let mastertl = gsap.timeline({
        paused: true,
        defaults: {
            ease: otherAnimationEase,
            duration: 0.3,
            autoAlpha: 0,
            onComplete: () => {
                animInprogress = false;
            },
            onReverseComplete: () => {
                animInprogress = false;
            }
        },
    });


    mastertl
        .from('.banner_description', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.horizontal_scroller_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.hs_container_1_text', {
            xPercent: -100,
        })
        .addPause()
        .to('.hs_inner', {
            xPercent: -50,
            autoAlpha: 1,
            ease: slideEase,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.one_col_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.one_col_text', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.tc_telco_content', {
            y: 200,
            autoAlpha: 0,
        })
        .from('.tc_telco_image', {
            y: 100,
            autoAlpha: 0,

        }, "<")
        .addPause()
        .to('.tc_telco_content', {
            y: -100,
            height: 0,
            autoAlpha: 0,
        })
        .from('.tc_digital_content', {
            y: 100,
            height: 0,
            autoAlpha: 0,
        }, "<")
        .to('.tc_telco_image_container', { autoAlpha: 1, scrollTo: { y: '.tc_telco_image_in_2', autoKill: false, ease: sectionEase, } }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_module_V2', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.tcV2_main_slide_heading ', {
            y: 100,
        })
        .addPause()
        .to('.two_col_module_V2_inner', {
            xPercent: window.innerWidth >= 767 ? -60 : -100,
            autoAlpha: 1,
            ease: slideEase,
            duration: slideDuration,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_logo_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.two_col_logo_heading, .two_col_logo_description', {
            y: 100,
        })
        .from('.two_col_logo_module .two_col_logo_image', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.graph_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.graph_slide_heading_inner_1', {
            y: 100,
        })
        .addPause()
        .to('.graph_slide_heading_inner_1', {
            autoAlpha: 0,
            height: 0,
            width: 0,
            duration: 0.1,
        })
        .from('.graph_slide_heading_inner_2', {
            y: 0,
        }, "<")
        .from('.graph_module_image', {
            x: 100
        }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.logo_slider_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.logo_slider_heading , .logo_slider_description', {
            y: 100,
        })
        .from(' .logo_slider_module .two_col_logo_container', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.one_col_module_V2_r', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.one_col_module_V2_r .one_col_V2_content ', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.contact_us_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.contact_us_heading, .contact_us_description, .contact_us_form_container', {
            y: 100,
        })
        .addPause()


    // Observer For Timeline
    const VodaObserver = Observer.create({
        type: "wheel, touch, pointer, touchmove",
        target: window,
        preventDefault: true,
        wheelSpeed: -1,
        tolerance: 100,
        dragMinimum: window.innerWidth >= 480 ? 100 : 20,
        scrollSpeed: 100000,
        onUp: (...d) => {
            // Animation for Touch device like tablet and Ipad
            if (window.matchMedia("(pointer: coarse)").matches) {
                if (mastertl.totalProgress() < 1 && mastertl.totalProgress() >= 0) {
                    animInprogress = true;
                    mastertl.play();
                }
                return;
            }

            // For devices having wheel event like Monitors with mouse and laptop with touchpad
            let pointerY = d[0].event.wheelDeltaY * -1;
            animTimeStamp = new Date();

            // 	Animation specific to laptop touchpad
            if (((pointerY < 20 && pointerY > 1 && !pointerY % 60 === 0) || (pointerY % 60 === 0) || (pointerY > 300))) {
                if ((pointerY < 20 && pointerY > 1) && (animTimeStamp2 == undefined || animTimeStamp - animTimeStamp2 >= 1000)) {
                    if (mastertl.totalProgress() < 1 && mastertl.totalProgress() >= 0) {
                        animInprogress = true;
                        mastertl.play();
                    }
                } // Animation specific to desktop mouse scroll
                else if ((pointerY % 60 === 0 || pointerY > 300) && (animTimeStamp2 == undefined || animTimeStamp - animTimeStamp2 >= 300)) {
                    if (mastertl.totalProgress() < 1 && mastertl.totalProgress() >= 0) {
                        animInprogress = true;
                        mastertl.play();
                    }
                }
                animTimeStamp2 = animTimeStamp;
            }
        },
        onDown: (...e) => {
            // Animation for Touch device like tablet and Ipad
            if (window.matchMedia("(pointer: coarse)").matches) {
                if (mastertl.totalProgress() <= 1 && mastertl.totalProgress() > 0) {
                    animInprogress = true;
                    mastertl.reverse();
                }
                return;
            }

            // For devices having wheel event like Monitors with mouse and laptop with touchpad
            let pointerY = e[0].event.wheelDeltaY;
            animTimeStamp = new Date();

            // 	Animation specific to laptop touchpad
            if (((pointerY < 20 && pointerY > 1 && !pointerY % 60 === 0) || (pointerY % 60 === 0) || (pointerY > 300)) && animInprogress == false) {
                if ((pointerY < 20 && pointerY > 1) && (animTimeStamp2 == undefined || animTimeStamp - animTimeStamp2 >= 700)) {
                    if (mastertl.totalProgress() <= 1 && mastertl.totalProgress() > 0) {
                        animInprogress = true;
                        mastertl.reverse();
                    }
                } // Animation specific to desktop mouse scroll
                else if ((pointerY % 60 === 0 || pointerY > 300) && (animTimeStamp2 == undefined || animTimeStamp - animTimeStamp2 >= 300)) {
                    if (mastertl.totalProgress() <= 1 && mastertl.totalProgress() > 0) {
                        animInprogress = true;
                        mastertl.reverse();
                    }
                }
                animTimeStamp2 = animTimeStamp;
            }
        },
    });



    // Animation on Arrow Key
    document.onkeydown = CheckKeyFun;
    function CheckKeyFun(key) {
        key.preventDefault();
        if (key.keyCode == '38') {
            if (mastertl.totalProgress() <= 1) {
                mastertl.reverse();
            }
        } else if (key.keyCode == '40') {
            if (mastertl.totalProgress() < 1) {
                mastertl.play();
            }
        }
    }


    // Nav Menu Link To Sections 
    let hamIcon = document.querySelector('#headerModule .hamIcon');
    hamIcon.onclick = linkListenerToNav;

    function linkListenerToNav() {
        let navTimeout = setTimeout(function () {
            // Menu Navbar
            let whatSetUsApartNav = document.querySelector('#menu-1-749d960 .whatSetUsApartMenu .elementor-item-anchor');
            let whatDoWeDoNav = document.querySelector('#menu-1-749d960 .whatDoWeDoMenu .elementor-item-anchor ');
            let whatDoWeOfferNav = document.querySelector('#menu-1-749d960 .whatDoWeOfferMenu .elementor-item-anchor');
            let ourClientsNav = document.querySelector('#menu-1-749d960 .ourClientsMenu .elementor-item-anchor');
            let socialImpactNav = document.querySelector('#menu-1-749d960 .socialImpactMenu .elementor-item-anchor');
            let contactUsNav = document.querySelector('#menu-1-749d960 .contactUsMenu .elementor-item-anchor');

            const navMenu = [whatSetUsApartNav, whatDoWeDoNav, whatDoWeOfferNav, ourClientsNav, socialImpactNav, contactUsNav];
            navMenu.forEach((menuItem) => {
                menuItem.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (menuItem.parentElement.classList.contains("whatSetUsApartMenu")) {
                        mastertl.progress(0.038).play();
                    } else if (menuItem.parentElement.classList.contains("whatDoWeDoMenu")) {
                        mastertl.progress(0.19).play();
                    } else if (menuItem.parentElement.classList.contains("whatDoWeOfferMenu")) {
                        mastertl.progress(0.39).play();
                    } else if (menuItem.parentElement.classList.contains("ourClientsMenu")) {
                        mastertl.progress(0.752).play();
                    } else if (menuItem.parentElement.classList.contains("socialImpactMenu")) {
                        mastertl.progress(0.856).play();
                    } else if (menuItem.parentElement.classList.contains("contactUsMenu")) {
                        mastertl.progress(0.93196).play();
                    }
                })
            })
        }, 100)
    }
}

const gsapInitializationMob = () => {


    // Initalizing custom easing function to match smoothing with Fullpage JS
    gsap.config({
        easeInOutCubic: function (progress) {
            return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
    });


    let sectionEase = "easeInOutCubic";
    let slideEase = "power3.easeinOut";
    let otherAnimationEase = "easeInOutCubic";

    let sectionDuration = 0.7;
    let slideDuration = 0.6;

    let animInprogress = false;
    let animTimeStamp, animTimeStamp2;

    // VodaMedia Development Page Specific GSAP Animation
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);
    gsap.registerPlugin(Observer);

    let mastertl = gsap.timeline({
        paused: true,
        defaults: {
            ease: otherAnimationEase,
            duration: 0.3,
            autoAlpha: 0,
        },
    });

    mastertl
        .from('.banner_description', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.horizontal_scroller_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.hs_container_1_text', {
            xPercent: -100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.horizontal_scroller_module .hs_container_2', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .addPause()
        .to(window, { scrollTo: { y: '.one_col_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.one_col_text', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.tc_telco_content', {
            y: 200,
            autoAlpha: 0,
        })
        .from('.tc_telco_image', {
            y: 100,
            autoAlpha: 0,
        }, "<")
        .addPause()
        .to('.tc_telco_content', {
            y: -100,
            height: 0,
            autoAlpha: 0,
        })
        .from('.tc_digital_content', {
            y: 100,
            height: 0,
            autoAlpha: 0,
        }, "<")
        .to('.tc_telco_image_container', { autoAlpha: 1, scrollTo: { y: '.tc_telco_image_in_2', autoKill: false, ease: sectionEase, } }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_module_V2', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.tcV2_main_slide_heading ', {
            y: 100,
        })
        .addPause()
        .to('.tcV2_main_slide_heading ', {
            autoAlpha: 0,
        })
        .to('.tcV2_main_slide, .tcV2_second_slide', {
            minHeight: '50vh',
            autoAlpha: 1,
        }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.two_col_logo_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.two_col_logo_module .two_col_logo_heading, .two_col_logo_module .two_col_logo_description', {
            y: 100,
        })
        .addPause()
        .to('.two_col_logo_module .two_col_logo_content, .two_col_logo_module .two_col_logo_container', {
            minHeight: "50vh",
            autoAlpha: 1,
        })
        .from('.two_col_logo_module .two_col_logo_image', {
            y: 100,
        }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.graph_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.graph_slide_heading_inner_1', {
            y: 100,
        })
        .addPause()
        .to('.graph_slide_heading_inner_1', {
            autoAlpha: 0,
            height: 0,
            width: 0,
        })
        .from('.graph_slide_heading_inner_2', {
            y: 0,
        }, "<")
        .from(' .graph_module_image', {
            y: 50,
        }, "<")
        .addPause()
        .to(window, { scrollTo: { y: '.logo_slider_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.logo_slider_heading , .logo_slider_description', {
            y: 100,
        })
        .from(' .logo_slider_module .two_col_logo_container', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.one_col_module_V2_r', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.one_col_module_V2_r .one_col_V2_content ', {
            y: 100,
        })
        .addPause()
        .to(window, { scrollTo: { y: '.contact_us_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, })
        .from('.contact_us_heading, .contact_us_description, .contact_us_form_container', {
            y: 100,
        })
        .addPause()


    //     Observer For Timeline For Mobile
    Observer.create({
        type: "wheel, touch, pointer, touchmove",
        target: window,
        preventDefault: true,
        wheelSpeed: -1,
        tolerance: 100,
        dragMinimum: window.innerWidth >= 480 ? 100 : 20,
        onUp: () => {
            // console.log(window.innerWidth);
            if (mastertl.totalProgress() < 1) {
                mastertl.play();
            }
        },
        onDown: () => {
            if (mastertl.totalProgress() <= 1) {
                mastertl.reverse();
            }
        },

    });


    // Animation on Arrow Key
    document.onkeydown = CheckKeyFun;
    function CheckKeyFun(key) {
        key.preventDefault();
        if (key.keyCode == '38') {
            if (mastertl.totalProgress() <= 1) {
                mastertl.reverse();
            }
        } else if (key.keyCode == '40') {
            if (mastertl.totalProgress() < 1) {
                mastertl.play();
            }
        }
    }


    // Nav Menu Link To Sections 
    let hamIcon = document.querySelector('#headerModule .hamIcon');
    hamIcon.onclick = linkListenerToNav;

    function linkListenerToNav() {
        let navTimeout = setTimeout(function () {
            // Menu Navbar
            let whatSetUsApartNav = document.querySelector('#menu-1-749d960 .whatSetUsApartMenu .elementor-item-anchor');
            let whatDoWeDoNav = document.querySelector('#menu-1-749d960 .whatDoWeDoMenu .elementor-item-anchor ');
            let whatDoWeOfferNav = document.querySelector('#menu-1-749d960 .whatDoWeOfferMenu .elementor-item-anchor');
            let ourClientsNav = document.querySelector('#menu-1-749d960 .ourClientsMenu .elementor-item-anchor');
            let socialImpactNav = document.querySelector('#menu-1-749d960 .socialImpactMenu .elementor-item-anchor');
            let contactUsNav = document.querySelector('#menu-1-749d960 .contactUsMenu .elementor-item-anchor');

            const navMenu = [whatSetUsApartNav, whatDoWeDoNav, whatDoWeOfferNav, ourClientsNav, socialImpactNav, contactUsNav];
            navMenu.forEach((menuItem) => {
                menuItem.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (menuItem.parentElement.classList.contains("whatSetUsApartMenu")) {
                        mastertl.progress(0.038).play();
                    } else if (menuItem.parentElement.classList.contains("whatDoWeDoMenu")) {
                        mastertl.progress(0.19).play();
                    } else if (menuItem.parentElement.classList.contains("whatDoWeOfferMenu")) {
                        mastertl.progress(0.39).play();
                    } else if (menuItem.parentElement.classList.contains("ourClientsMenu")) {
                        mastertl.progress(0.752).play();
                    } else if (menuItem.parentElement.classList.contains("socialImpactMenu")) {
                        mastertl.progress(0.856).play();
                    } else if (menuItem.parentElement.classList.contains("contactUsMenu")) {
                        mastertl.progress(0.93196).play();
                    }
                })
            })
        }, 100)
    }




}


let mainDevelopmentPage = document.querySelector('.page-id-1538');
if (mainDevelopmentPage != null) {
    if (window.innerWidth < 768) {
        window.addEventListener('load', gsapInitializationMob);
        window.addEventListener('resize', gsapInitializationMob);
    } else {
        window.addEventListener('load', gsapInitialization);
        window.addEventListener('resize', gsapInitialization);
    }
}

// Scroll To Top Function
function smoothScrollToTop() {
    const rootElement = document.documentElement;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;

}
smoothScrollToTop();
window.addEventListener("load", smoothScrollToTop);
window.addEventListener("beforeunload", smoothScrollToTop);
document.addEventListener("load", smoothScrollToTop);

function reloadPage() {
    window.location.reload()
}

let backToTopArrow = document.querySelector('.backToTopArrow > .e-con-inner');
backToTopArrow.addEventListener('click', reloadPage);


// ==============================================================================================
// =============================== Testing Page =================================================
// ==============================================================================================


let mobileWidth = 767, myhighChart;
const FullPageInitialization = () => {

    let bannerAnimCounter = 0, whatSetsUsApartAnimCounter = 0, telcoDigitalAnimCounter = 0, twoColModV2AnimCounter = 0, graphAnimCounter = 0, telcoDigitalContentHeight,
        twoColLogoAnimCounter = 0, fullHeight = "100vh", halfHeight = "50vh", zeroHeight = "0";
    let tweenDuration = 0.4;
    let tweenEase = "power3.easeinOut";

    const afterRenderFun = () => {

        // Telco & Digital
        if (document.querySelector('.tc_digital_content').offsetHeight < document.querySelector('.tc_telco_content').offsetHeight) {
            document.querySelector('.two_col_content_container').style.setProperty('--height', `${document.querySelector('.tc_telco_content').offsetHeight}px`);
            telcoDigitalContentHeight = document.querySelector('.tc_telco_content').offsetHeight;
        } else {
            document.querySelector('.two_col_content_container').style.setProperty('--height', `${document.querySelector('.tc_digital_content').offsetHeight}px`);
            telcoDigitalContentHeight = document.querySelector('.tc_digital_content').offsetHeight;
        }
        document.querySelector('.tc_telco_content').style.height = `${telcoDigitalContentHeight}px`;
        document.querySelector('.tc_digital_content').style.height = `${telcoDigitalContentHeight}px`;

        gsap.defaults({
            duration: tweenDuration,
            ease: tweenEase,
        })
        // GSAP in action
        gsap.set('.one_col_text, .two_col_inner, .tcV2_main_slide_heading, .two_col_logo_inner, .graph_module_v2 .graph_module_graph_inner, .logo_slider_inner, .one_col_V2_content ', {
            y: 100,
            autoAlpha: 0,
            duration: tweenDuration,
            ease: tweenEase,
        })
        // gsap.set('.graph_module_v2 .graph_main_output', {
        //     y: 30,
        //     autoAlpha: 0,
        //     duration: tweenDuration,
        //     ease: tweenEase,
        // })
        gsap.set('.hs_container_right_bottom', {
            display: "none",
            autoAlpha: 0,
            duration: tweenDuration,
            ease: tweenEase,
        })
        gsap.set('.hs_container_1_text', {
            x: -100,
            autoAlpha: 0,
            duration: tweenDuration,
            ease: tweenEase,
        })
        gsap.set('.tc_digital_content', {
            autoAlpha: 0,
            duration: tweenDuration,
            ease: tweenEase,
        })
        gsap.set('.what_we_offer_logo_container', {
            display: "none",
            autoAlpha: 0,
        })
        gsap.set('.tcV2_main_slide', {
            width: "100vw",
            height: fullHeight,
            autoAlpha: 1,
            duration: tweenDuration,
            ease: tweenEase,
        })
        gsap.set('.tcV2_second_slide', {
            width: "0vw",
            height: fullHeight,
            autoAlpha: 0,
            duration: tweenDuration,
            ease: tweenEase,
        })
        gsap.set('.tcV2_second_slide_inner', {
            autoAlpha: 0,
        })
        // gsap.set('.graph_module_v2 .red_arrows', {
        //     y: 50,
        //     autoAlpha: 0,
        //     duration: tweenDuration,
        //     ease: tweenEase,
        // })
        // gsap.set(".graph_module_v2 .graph_main_output", {
        //     autoAlpha: 0,
        // })

    }

    // This function will called whenever a section or slide is loaded
    const afterLoadFun = (origin, destination, direction, trigger) => {
        progressBarScroll();

        // console.log("origin: " + origin.index + " destination: " + destination.index + " direction: " + direction + " trigger: " + trigger);

        if (direction == "down") {
            if (destination.index == 1) {
                gsap.to(".hs_container_1_text", {
                    x: 0,
                    autoAlpha: 1,
                })
                gsap.to(".hs_arrow_image", {
                    autoAlpha: 1,
                })
                return false;
            }
            if (destination.index == 2) {
                gsap.to(".tcV2_main_slide_heading", {
                    y: 0,
                    autoAlpha: 1,
                })
                return false;
            }
            if (destination.index == 3) {
                gsap.to(".two_col_inner", {
                    y: 0,
                    autoAlpha: 1,
                    onStart: () => { document.querySelector('.hamIcon svg path').style.stroke = "var(--e-global-color-secondary)"; },
                })
                return false;
            }
            if (destination.index == 4) {
                // gsap.to(".dca_heading", {
                //     y: 0,
                //     autoAlpha: 1,
                // })
                gsap.to('.graph_module_v2 .graph_module_graph_inner',{
                    y: 0,
                    autoAlpha: 1,
                    onStart: () => { HighChartGraph(); }
                })
                return false;
            }
            if (destination.index == 5) {
                gsap.to(".logo_slider_inner", {
                    y: 0,
                    autoAlpha: 1,
                })
                return false;
            }
            if (destination.index == 6) {
                gsap.to(".one_col_V2_content ", {
                    y: 0,
                    autoAlpha: 1,
                })
                return false;
            }
            if (destination.index == 7) {
                gsap.to(".contact_us_module > .e-con-inner", {
                    y: 0,
                    autoAlpha: 1,
                })
                return false;
            }
        }

        if (direction == "up") {
            if (destination.index == 0) {
                gsap.to(".hs_container_1_text", {
                    x: -100,
                    autoAlpha: 0,
                })
                gsap.to(".hs_arrow_image", {
                    autoAlpha: 0,
                })
                return false;
            }
            if (destination.index == 1) {
                gsap.to(".two_col_inner", {
                    y: 100,
                    autoAlpha: 0,
                })
                return false;
            }
            if (destination.index == 2) {
                gsap.to(".tcV2_main_slide_heading", {
                    y: 100,
                    autoAlpha: 0,
                    onComplete: () => { document.querySelector('.hamIcon svg path').style.stroke = "var(--e-global-color-primary)"; }
                })
                return false;
            }
            if (destination.index == 3) {
                gsap.to(".graph_module_v2 .graph_module_graph_inner", {
                    y: 100,
                    autoAlpha: 0,
                    onComplete: () => { myhighChart.destroy(); }
                })
                return false;
            }
            if (destination.index == 4) {
                gsap.to(".logo_slider_inner", {
                    y: 100,
                    autoAlpha: 0,
                })
                return false;
            }
            if (destination.index == 5) {
                gsap.to(".one_col_V2_content ", {
                    y: 100,
                    autoAlpha: 0,
                })
                return false;
            }
            if (destination.index == 6) {
                gsap.to(".contact_us_module > .e-con-inner", {
                    y: 100,
                    autoAlpha: 1,
                })
                return false;
            }
        }



    }

    const onbeforeLeaveFun = (origin, destination, direction, trigger) => {
        if (direction == "down") {
            // if (destination.index == 1 && bannerAnimCounter == 0) {
            //     gsap.to(".banner_description", {
            //         y: 0,
            //         autoAlpha: 1,
            //     })
            //     bannerAnimCounter++;
            //     return false;
            // }
            if (destination.index == 2 && whatSetsUsApartAnimCounter == 0) {
                const whatSetsUsApartTimelineDown = gsap.timeline();
                whatSetsUsApartTimelineDown.to('.hs_arrow_image', {
                    display: "none",
                    autoAlpha: 0,
                })
                    .to('.halfCutVodamediaLogo', {
                        autoAlpha: 0,
                    }, "<")
                    .to('.hs_container_right_bottom', {
                        display: "block",
                        autoAlpha: 1,
                    })
                whatSetsUsApartAnimCounter++
                return false;
            }
            if (destination.index == 3 && twoColModV2AnimCounter == 0) {
                gsap.to('.tcV2_main_slide', {
                    width: "50vw",
                    onStart: () => { document.querySelector('.hamIcon svg path').style.stroke = "var(--e-global-color-primary)"; }
                })
                gsap.to('.tcV2_main_slide_heading', {
                    autoAlpha: 0,
                })
                gsap.to('.tcV2_second_slide', {
                    width: "50vw",
                    autoAlpha: 1,
                })
                gsap.to('.tcV2_second_slide_inner', {
                    autoAlpha: 1,
                    delay: 0.3,
                })
                twoColModV2AnimCounter++;
                return false;
            }
            // if (destination.index == 3 && twoColModV2AnimCounter == 1) {
            //     gsap.to('.tcV2_main_slide ', {
            //         width: "0vw",
            //         autoAlpha: 0,
            //     })
            //     gsap.to('.tcV2_second_slide_heading  ', {
            //         paddingLeft: window.innerWidth > 1024 ? "60px" : "0px",
            //         paddingTop: window.innerWidth > 1024 ? "40px" : "0px",
            //     })
            //     gsap.to('.tcV2_second_slide', {
            //         width: "100vw",
            //     })
            //     gsap.to('.tcV2_second_slide_content_container', {
            //         display: "none",
            //         autoAlpha: 0,
            //         duration: 0,
            //     })
            //     gsap.to('.what_we_offer_logo_container', {
            //         display: "block",
            //         autoAlpha: 1,
            //     })
            //     twoColModV2AnimCounter++;
            //     return false;
            // }
            if (destination.index == 4 && telcoDigitalAnimCounter == 0) {
                gsap.to('.tc_telco_content', {
                    y: -telcoDigitalContentHeight,
                    autoAlpha: 0,
                })
                gsap.to('.tc_digital_content', {
                    y: -telcoDigitalContentHeight,
                    autoAlpha: 1,
                }, "< += 0.5")
                if (window.innerWidth > 1024) {
                    gsap.to('.tc_telco_image_in_1', {
                        y: -(document.querySelector('.tc_telco_image_in_1').offsetHeight),
                    })
                    gsap.to('.tc_telco_image_in_2', {
                        y: -(document.querySelector('.tc_telco_image_in_2').offsetHeight),
                    })
                } else {
                    gsap.to('.tc_telco_image_mobile_view .tc_telco_image_in_1', {
                        y: -(document.querySelector('.tc_telco_image_mobile_view .tc_telco_image_in_1').offsetHeight),
                    })
                    gsap.to('.tc_telco_image_mobile_view .tc_telco_image_in_2', {
                        y: -(document.querySelector('.tc_telco_image_mobile_view .tc_telco_image_in_2').offsetHeight),
                    })
                }
                telcoDigitalAnimCounter++;
                return false;
            }
            // if (destination.index == 5) {
            //     let graphSecTimeline = gsap.timeline();
            //     graphSecTimeline
            //         .to(".dca_heading", {
            //             display: "none",
            //             autoAlpha: 0,
            //             y: 0,
            //         }).to(".graph_module_v2 .graph_bg_overlay", {
            //             autoAlpha: 0,
            //         },)
            //         .to(".graph_module_v2 .graph_slide_heading_text", {
            //             display: "block",
            //             autoAlpha: 1,
            //             y: 0,
            //         }, "<").to(".graph_module_v2 .red_arrows, .graph_module_v2 .graph_main_output, .graph_module_v2 .graph_slide_description_text", {
            //             y: 0,
            //             autoAlpha: 1,
            //             onStart: () => { HighChartGraph(); }
            //         }, "<")
            //     graphAnimCounter++;
            //     return false;
            // }
        }

        if (direction == "up") {
            if (origin.index == 0 && destination.index == 0 && bannerAnimCounter > 0) {
                bannerAnimCounter--;
            }
            if (destination.index == 0 && whatSetsUsApartAnimCounter > 0) {
                const whatSetsUsApartTimelineUp = gsap.timeline();
                whatSetsUsApartTimelineUp.to('.hs_container_right_bottom', {
                    display: "none",
                    autoAlpha: 0,
                })
                    .to('.halfCutVodamediaLogo', {
                        autoAlpha: 1,
                    }, "<")
                    .to('.hs_arrow_image', {
                        display: "block",
                        autoAlpha: 1,
                    })
                whatSetsUsApartAnimCounter--
                return false;
            }
            if (destination.index == 1 && twoColModV2AnimCounter == 1) {
                gsap.to('.tcV2_main_slide', {
                    width: "100vw",
                    onStart: () => { document.querySelector('.hamIcon svg path').style.stroke = "var(--e-global-color-secondary)"; }
                })
                gsap.to('.tcV2_main_slide_heading', {
                    autoAlpha: 1,
                    y:0,
                })
                gsap.set('.tcV2_second_slide', {
                    width: "0vw",
                    autoAlpha: 1,
                })
                gsap.to('.tcV2_second_slide_inner', {
                    autoAlpha: 0,
                })
                twoColModV2AnimCounter--;
                return false;
            }
            // if (destination.index == 1 && twoColModV2AnimCounter == 2) {
            //     gsap.to('.tcV2_main_slide ', {
            //         width: "50vw",
            //         autoAlpha: 1,
            //     })
            //     gsap.to('.tcV2_second_slide_heading  ', {
            //         paddingLeft: "0px",
            //         paddingTop: "0px"
            //     })
            //     gsap.to('.tcV2_second_slide', {
            //         width: "50vw",
            //     })
            //     gsap.to('.tcV2_second_slide_content_container', {
            //         display: "block",
            //         autoAlpha: 1,
            //     })
            //     gsap.to('.what_we_offer_logo_container', {
            //         display: "none",
            //         autoAlpha: 0,
            //         duration: 0,
            //     })
            //     twoColModV2AnimCounter--;
            //     return false;
            // }
            if (destination.index == 2 && telcoDigitalAnimCounter == 1) {
                gsap.to('.tc_digital_content', {
                    y: 0,
                    autoAlpha: 0,
                })
                gsap.to('.tc_telco_content', {
                    y: 0,
                    autoAlpha: 1,
                }, "< += 0.5")
                gsap.to('.tc_telco_image_in_1', {
                    y: 0,
                })
                gsap.to('.tc_telco_image_in_2', {
                    y: 0,
                })
                telcoDigitalAnimCounter--;
                return false;
            }
            // if (destination.index == 3) {
            //     let graphSecTimelineUp = gsap.timeline();
            //     graphSecTimelineUp
            //         .to('.graph_module_v2 .graph_slide_heading_text', {
            //             display: "none",
            //             y: 100,
            //             autoAlpha: 0,
            //             duration: 0,
            //         }, ">")
            //         .to('.dca_heading', {
            //             display: "block",
            //             y: 0,
            //             autoAlpha: 1,
            //         }, "<")
            //         .to(".graph_module_v2 .red_arrows, .graph_module_v2 .graph_main_output, .graph_module_v2 .graph_slide_description_text", {
            //             y: 100,
            //             autoAlpha: 0,
            //         }, "<").to(".graph_module_v2 .graph_bg_overlay", {
            //             autoAlpha: 1,
            //         }, "<").to(".graph_module_v2 .graph_slide_heading_text", {
            //             onComplete: () => { myhighChart.destroy(); }
            //         }, "<")
            //     graphAnimCounter--;
            //     return false;
            // }
        }


    }


    var myFullpage = new fullpage('.elementor-3813, .elementor-3940', {
        licenseKey: '2K3LK-6CTQK-HF6HH-Q610H-PNPOO',
        autoScrolling: true,
        scrollHorizontally: true,
        controlArrows: false,
        afterRender: afterRenderFun,
        afterLoad: afterLoadFun,
        beforeLeave: onbeforeLeaveFun,
    })


}

const FullPageGsapInitializationMob = () => {

    // Initalizing custom easing function to match smoothing with Fullpage JS
    gsap.config({
        easeInOutCubic: function (progress) {
            return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
    });


    let sectionEase = "easeInOutCubic";
    let otherAnimationEase = "easeInOutCubic";
    let sectionDuration = 0.7;

    // VodaMedia Development Page Specific GSAP Animation
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);
    gsap.registerPlugin(Observer);

    let mastertl = gsap.timeline({
        paused: true,
        defaults: {
            ease: otherAnimationEase,
            duration: 0.3,
            autoAlpha: 0,
        },
    });
    gsap.set('.banner_heading', {
        autoAlpha: 1,
    })
    // gsap.set(".graph_module_v2 .graph_slide_heading_text", {
    //     display: "none",
    //     autoAlpha: 0,
    // })
    mastertl
        // // Banner Module
        // .from('.banner_description', {
        //     y: 100,
        // })
        // .addPause()

        // Horizontal Module [ What Sets Us Apart ]
        .to(window, { scrollTo: { y: '.horizontal_scroller_module', autoKill: false }, duration: sectionDuration, ease: sectionEase, onComplete:()=>{progressBarScrollMobile(1)},onReverseComplete:()=>{progressBarScrollMobile(0)}, })
        .from('.hs_container_1_text', {
            xPercent: -100,
        })
        .fromTo('.hs_arrow_image_mob', {
            autoAlpha: 0,
        }, { display: "block", autoAlpha: 1, })
        .addPause()
        .to('.halfCutVodamediaLogo', {
            autoAlpha: 0,
        })
        .to('.hs_container_1_inner', {
            minHeight: "100px",
            autoAlpha: 1,
        })
        .to('.hs_arrow_image_mob', {
            autoAlpha: 0,
            display: "none"
        }, "<")
        .to('.hs_container_1_inner > div', {
            paddingTop: window.innerWidth > 480 ? "50px" : "60px",
            autoAlpha: 1,
        }, "<")
        .to('.hs_container_1_inner_2', {
            marginTop: 0,
            autoAlpha: 1,
        }, "<")
        .fromTo('.hs_container_right_bottom ', {
            autoAlpha: 0,
            display: "none"
        }, { display: "block", autoAlpha: 1, })
        .addPause()

        // Two Col V2 [ What We Do ]
        .to(window, { scrollTo: { y: '.two_col_module_V2', autoKill: false }, duration: sectionDuration, ease: sectionEase, onComplete:()=>{progressBarScrollMobile(2)},onReverseComplete:()=>{progressBarScrollMobile(1)},})
        .from('.tcV2_main_slide_heading ', {
            y: 100,
        })
        .addPause()
        .to('.tcV2_main_slide_heading ', {
            autoAlpha: 0,
        }, "<")
        .fromTo('.tcV2_main_slide', {
            backgroundPosition: "81% 50%",
            backgroundSize: "400%",
            autoAlpha: 1,
        }, {
            backgroundPosition: "92% 50%",
            backgroundSize: "200%",
            autoAlpha: 1,
            // duration:0.,
        }, "<")
        .to('.tcV2_main_slide', {
            minHeight: '40vh',
            autoAlpha: 1,
            // backgroundPosition: "92% 50%",
            // backgroundSize: "200%",
        }, "<")
        .to('.tcV2_second_slide', {
            minHeight: '60vh',
            autoAlpha: 1,
        }, "<")
        .addPause()
        // .to('.tcV2_second_slide_content_container', {
        //     display: "none",
        //     duration: 0.1,
        //     autoAlpha: 0,
        // }).fromTo('.what_we_offer_logo_container', {
        //     display: "none",
        //     duration: 0,
        //     autoAlpha: 0,
        // }, {
        //     display: "block",
        //     autoAlpha: 1,
        // })
        // .addPause()

        // Two Col Module [Telco & Digital] 
        .to(window, { scrollTo: { y: '.two_col_module', autoKill: false }, duration: sectionDuration, ease: sectionEase,onComplete:()=>{progressBarScrollMobile(3)},onReverseComplete:()=>{progressBarScrollMobile(2)}, })
        .from('.tc_telco_content', {
            y: 200,
            autoAlpha: 0,
        })
        .from('.tc_telco_image', {
            y: 100,
            autoAlpha: 0,
        }, "<")
        .addPause()
        .to('.tc_telco_content', {
            y: -100,
            height: 0,
            autoAlpha: 0,
        })
        .from('.tc_digital_content', {
            y: 100,
            height: 0,
            autoAlpha: 0,
        }, "<")
        .to('.tc_telco_image_mobile_view .tc_telco_image_container', { autoAlpha: 1, scrollTo: { y: '.tc_telco_image_mobile_view .tc_telco_image_in_2', autoKill: false, ease: sectionEase, } }, "<")
        .addPause()


        // Graph Module
        .to(window, { scrollTo: { y: '.graph_module_v2', autoKill: false }, duration: sectionDuration, ease: sectionEase,onComplete:()=>{progressBarScrollMobile(4)},onReverseComplete:()=>{progressBarScrollMobile(3)}, })
        // .from('.dca_heading', {
        //     y: 100,
        //     autoAlpha: 0,
        // })
        // .addPause()
        // .to('.dca_heading', {
        //     display: "none",
        //     autoAlpha: 0,
        //     duration: 0.1,
        // })
        // .to(".graph_module_v2 .graph_bg_overlay", {
        //     autoAlpha: 0,
        // }, "<")
        // .to(".graph_module_v2 .graph_slide_heading_text", {
        //     y: 0,
        //     display: "block",
        //     autoAlpha: 1,
        //     duration: 0.1,
        // })
        .from(".graph_module_v2 .graph_module_graph_inner", {
            y: 100,
            autoAlpha: 0,
            onStart: () => { HighChartGraph(); }
        })
        .addPause()
        .addPause()

        // Logo Slider [ Our Clients ]
        .to(window, { scrollTo: { y: '.logo_slider_module', autoKill: false }, duration: sectionDuration, ease: sectionEase,onComplete:()=>{progressBarScrollMobile(5)},onReverseComplete:()=>{progressBarScrollMobile(4)}, })
        .from('.logo_slider_inner ', {
            y: 100,
            delay: 0,
        })
        .addPause()

        // One Col V2 [ Social Projects ]
        .to(window, { scrollTo: { y: '.one_col_module_V2_r', autoKill: false }, duration: sectionDuration, ease: sectionEase,onComplete:()=>{progressBarScrollMobile(6)},onReverseComplete:()=>{progressBarScrollMobile(5)}, })
        .from('.one_col_module_V2_r .one_col_V2_content ', {
            y: 100,
        })
        .addPause()

        // Contact Us
        .to(window, { scrollTo: { y: '.contact_us_module', autoKill: false }, duration: sectionDuration, ease: sectionEase,onComplete:()=>{progressBarScrollMobile(7)}, onReverseComplete:()=>{progressBarScrollMobile(6)}, })
        .from('.contact_us_module > .e-con-inner ', {
            y: 100,
        }, "<")
        .addPause()


    //     Observer For Timeline For Mobile
    Observer.create({
        type: "wheel, touch, pointer, touchmove",
        target: window,
        preventDefault: true,
        wheelSpeed: -1,
        tolerance: 100,
        dragMinimum: window.innerWidth >= 480 ? 100 : 20,
        onUp: () => {
            if (mastertl.totalProgress() < 1) {
                mastertl.play();
            }
        },
        onDown: () => {
            if (mastertl.totalProgress() <= 1) {
                mastertl.reverse();
            }
        },

    });


    // Animation on Arrow Key
    document.onkeydown = CheckKeyFun;
    function CheckKeyFun(key) {

        if (key.keyCode == '38') {
            key.preventDefault();
            if (mastertl.totalProgress() <= 1) {
                mastertl.reverse();
            }
        } else if (key.keyCode == '40') {
            key.preventDefault();
            if (mastertl.totalProgress() < 1) {
                mastertl.play();
            }
        }
    }

}

let widthForHighChart, heightForHighChart, fontSizeForHighChart;
const HighChartGraph = () => {
    if (window.innerWidth > 1470) {
        widthForHighChart = 670;
        heightForHighChart = 610;
        fontSizeForHighChart = "25px";
    }
    if(window.innerWidth <= 1470 && window.innerWidth < 1280) {
        widthForHighChart = 400;
        heightForHighChart = 400;
    }
    if(window.innerWidth <= 1280 && window.innerWidth > 480) {
        widthForHighChart = 400;
        heightForHighChart = 400;
        fontSizeForHighChart = "18px";
    }
    if(window.innerWidth <= 480 && window.innerWidth > 380) {
        widthForHighChart = 300;
        heightForHighChart = 300;
        fontSizeForHighChart = "14px";
    }
    if(window.innerWidth <= 380 && window.innerWidth > 0) {
        widthForHighChart = 280;
        heightForHighChart = 280;
        fontSizeForHighChart = "10px";
    }
    myhighChart = Highcharts.chart('graph_main_output_id', {
        chart: {
            type: 'column',
            inverted: true,
            polar: true,
            marginTop: 25,
            borderWidth: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
            width: widthForHighChart,
            height: heightForHighChart,
        },
        xAxis: {
            title: {
                text: null
            },
            autoWidth: true,
            step: 1,
            lineWidth: 0,
            gridLineWidth: 0,
            formatter: function () {
                if (this.chart.width < 480) {
                    return this.value.slice(0, 5) + '...'; // Shorten labels on mobile
                } else {
                    return this.value;
                }
            },
            categories: [
                '1. Sim Push', '2. SMS/Video/Int MMS', '3. Display', '4. PCM/Video', '5. VMCK/MCK'],
            labels: {
                step: 1,
                style: {
                    fontSize: fontSizeForHighChart,
                }
            }
        },
        yAxis: {
            min: 0,
            max: 8,
            showLastLabel: true,
            gridLineWidth: 0,

            labels: {
                format: '{value}%',
                style: {
                    fontWeight: 'bold',
                    fontSize: fontSizeForHighChart,
                }
            }
        },
        legend: {
            enabled: false  // Disable default legend
        },
        credits: {
            enabled: false
        },
        pane: {
            startAngle: 0,
            endAngle: 250
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 0,
                pointPadding: 0,
                groupPadding: 0.05,
                pointPlacement: 'between',
                dataLabels: {
                    enabled: true,
                    allowOverlap: false,
                    textPath: {
                        enabled: false,
                        attributes: {
                            textAnchor: '',
                            startOffset: 20,
                            dy: 0
                        }
                    }
                }
            }
        },
        series: [{
            bar: {
                centerInCategory: true // Center bars and labels in categories
            },
            allowPointSelect: true,
            allowSeriesInteraction: true,
            data: [8, 5.45, 0.6, 0.23, 0.12],
            color: 'rgba(190, 22, 34, 0.9)',
            dataLabels: {
                enabled: true,  // Enable data labels
                style: {
                    fontSize: '14px'  // Increase font size to 14px
                },
                // textAnchor: 'end',
            },
        }]
    });
}

document.onresize = HighChartGraph();

const CustomScrollBar = () => {
    let mainContainerParent = document.querySelector('.hfeed');
    let scrollBarParent = document.createElement('div');
    scrollBarParent.classList.add("progress-parent");
    scrollBarParent.innerHTML = `<div class="progress-container fp-noscroll">
        <div class="progress-bar" id="progressBar">
        </div>
    </div>`;
    mainContainerParent.append(scrollBarParent);
}
CustomScrollBar();

const setCssVariable = () => {
    // Setting variable to footer variable
    let contactUsCenterText = document.querySelector('.contact_us_module .footer_right_container > .e-con-inner');
    let copyrightFooterContainer = document.querySelector('.copyright_footer_container');
    copyrightFooterContainer.style.setProperty('--faqTcWidth', `${contactUsCenterText.offsetWidth / 2}px`);
}
setCssVariable()


function progressBarScroll() {
    // Desktop
    let scrollBarParent = document.querySelector('.progress-parent');
    let scrollTrack = scrollBarParent.querySelector('.progress-bar');
    let totalSection = fullpage_api.test.K.length;
    let activeSection = fullpage_api.getActiveSection().index();
    scrollTrack.style.height = `${scrollBarParent.offsetHeight / totalSection}px`;
    scrollTrack.style.top = `${(scrollBarParent.offsetHeight / totalSection) * activeSection}px`;

}

function progressBarScrollMobile(index) {
    // console.log(index);
    let sectionArr = document.querySelectorAll('.section');
    let scrollBarParent = document.querySelector('.progress-parent');
    let scrollTrack = scrollBarParent.querySelector('.progress-bar');
    let totalSection = sectionArr.length;
    let activeSection = index;
    scrollTrack.style.height = `${scrollBarParent.offsetHeight / totalSection}px`;
    // console.log(`${scrollBarParent.offsetHeight / totalSection}px`);
    scrollTrack.style.top = `${(scrollBarParent.offsetHeight / totalSection) * activeSection}px`;
    // console.log(`${(scrollBarParent.offsetHeight / totalSection) * activeSection}px`);
}
progressBarScrollMobile(0)



let testingPage = document.querySelector('.page-id-3813');
if (testingPage != null) {
    if (window.innerWidth > mobileWidth) {
        FullPageInitialization();
    } else {
        FullPageGsapInitializationMob();
    }
}



// ==============================================================================================
// =============================== Testing Page V4 ==============================================
// ==============================================================================================

let testingPage2 = document.querySelector('.page-id-3940');
if (testingPage2 != null) {
    FullPageInitialization();
}





