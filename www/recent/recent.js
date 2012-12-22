Deferred.define();

Air = {};
Air.API = {
	getRecentFiles : function () {
		var d = new Deferred();
		$.ajax({
			url: "/cgi-bin/recent.cgi",
			type : "GET",
			data : {},
			dataType: 'text'
		}).
		done(function (data) {
			var files = [];

			var lines = data.split(/\n/);
			for (var i = 0, len = lines.length; i < len; i++) {
				var row = lines[i].split(/\t/);
				if (!row[0]) continue;
				files.push({
					path : row[0],
					ext  : (row[0].match(/(?:\.(\w+))?$/)[1] || '').toUpperCase(),
					filename : row[0].match(/[^\/]*$/)[0],
					date : new Date(+row[1] * 1000),
					size : +row[2]
				});
			}

			console.log(files);
			d.call(files);
		}).
		fail(function (e) {
			d.fail(e);
		});
		return d;
	},

	// require lscache
	getThumbnailURL : function (path, size) {
		var d = new Deferred();
		size = size * (window.devicePixelRatio || 1);

		var cache = lscache.get('thumbnail:' + path);
		if (!cache) {
			console.log(['create thumbnail', path]);

			if (!arguments.callee.queue) arguments.callee.queue = [];
			var queue = arguments.callee.queue;
			queue.push({ path : path, size : size, deferred : d });

			if (!queue.worker) {
				queue.worker = next(function () {
					return next(function () {
						var job  = queue.shift();
						if (!job) throw "done";
						var path = job.path;
						var size = job.size;
						var ret  = new Deferred();

						var img = new Image();
						img.onload = function () {
							try {
								var canvas = document.createElement('canvas');
								canvas.setAttribute('width', size);
								canvas.setAttribute('height', size);

								var ctx = canvas.getContext('2d');
								var source = Math.min(img.height, img.width) * 0.9;
								ctx.drawImage(img,
									(img.width  - source) / 2,
									(img.height - source) / 2,
									source,
									source,
									0,
									0,
									size,
									size
								);
								var url = canvas.toDataURL('image/jpeg', 0.8);
								console.log(['cached thumbnail/size:', url.length ]);
								lscache.set('thumbnail:' + path, url);
								job.deferred.call(url);
							} catch (e) { job.deferred.fail(e) }
							ret.call();
						};
						img.src = '/cgi-bin/thumbNail?fn=/www/sd/DCIM/' + path;

						return ret;
					}).
					next(arguments.callee);
				}).
				error(function (e) {
					if (e === 'done') return delete queue.worker;
					alert(e);
				});
			}
		} else {
			// console.log(['cached thumbnail:', path]);
			next(function () { d.call(cache) });
		}

		return d;
	}
};

Air.Recent = {
	init : function () {
		var self = this;

		if (location.hash == '#nocache') lscache.flush();

		self.bindResizeEvent();
		self.load();
	},

	bindResizeEvent : function () {
		var self = this;
		var eles = $('.ui-just');
		$(window).resize(function () {
			var padding = 5;
			var itemWidth = 100 + padding;
			var row = Math.floor( ($(window).width() - padding) / itemWidth );
			eles.width(row * itemWidth);
			self.row = row;
		}).resize();
	},

	load : function () {
		var self = this;

		var list    = $('#list');
		var loading = $('.loading');

		loading.show();

		return Air.API.getRecentFiles().
			next(function (files) {
				loading.hide();

				for (var i = 0, it; (it = files[i]); i++) {
					var box = $(window.tmpl('listTmpl')(it));
					self.loadThumbnailImage(box);
					list.append(box);
				}
			});
	},

	loadThumbnailImage : function (parent) {
		parent.find('img.thumbnail[data-path]').each(function () {
			var target = this;
			var path = target.getAttribute('data-path');
			return Air.API.getThumbnailURL(path, 100).next(function (url) {
				target.src = url;
			});
		});
	}
};


Air.Recent.init();
