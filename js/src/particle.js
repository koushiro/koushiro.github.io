!function () {
    function n(n, e, t) {
        return n.getAttribute(e) || t
    }
    function e(n) {
        return document.getElementsByTagName(n)
    }
    function t() {
        i = a.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
            c = a.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
    function o() {
        d.clearRect(0, 0, i, c);
        var n, e, t, a, m, r, y = [x].concat(w);
        w.forEach(function (o) {
            for (o.x += o.xa, o.y += o.ya, o.xa *= o.x > i || o.x < 0 ? -1 : 1, o.ya *= o.y > c || o.y < 0 ? -1 : 1, d.fillRect(o.x - .5, o.y - .5, 1, 1), e = 0; e < y.length; e++)
                n = y[e], o !== n && null !== n.x && null !== n.y && (a = o.x - n.x, m = o.y - n.y, (r = a * a + m * m) < n.max && (n === x && r >= n.max / 2 && (o.x -= .03 * a, o.y -= .03 * m), t = (n.max - r) / n.max, d.beginPath(), d.lineWidth = t / 2, d.strokeStyle = "rgba(" + u.c + "," + (t + .2) + ")", d.moveTo(o.x, o.y), d.lineTo(n.x, n.y), d.stroke())); y.splice(y.indexOf(o), 1)
        }), l(o)
    }
    var i, c, a = document.createElement("canvas"), u = function () {
        var t = e("script"), o = t.length, i = t[o - 1];
        return {
            l: o, z: n(i, "zIndex", -1),
            o: n(i, "opacity", .5),
            c: n(i, "color", "0,0,0"),
            n: n(i, "count", 99)
        }
    }(),
        m = "c_n" + u.l,
        d = a.getContext("2d"),
        l = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (n) { window.setTimeout(n, 1e3 / 45) },
        r = Math.random, x = { x: null, y: null, max: 2e4 };
    a.id = m, a.style.cssText = "position:fixed;top:0;left:0;z-index:" + u.z + ";opacity:" + u.o,
        e("body")[0].appendChild(a),
        t(),
        window.onresize = t,
        window.onmousemove = function (n) {
            n = n || window.event,
                x.x = n.clientX,
                x.y = n.clientY
        },
        window.onmouseout = function () {
            x.x = null,
                x.y = null
        };
    for (var w = [], y = 0; u.n > y; y++) {
        var s = r() * i, f = r() * c, h = 2 * r() - 1, g = 2 * r() - 1;
        w.push({
            x: s,
            y: f,
            xa: h,
            ya: g,
            max: 6e3
        })
    }
    setTimeout(function () { o() }, 100)
}();