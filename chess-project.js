function plot_it()  {


/***********************************************************************************\
|*                                                                                 *|
|*                                      SETUP                                      *|
|*                                                                                 *|
\***********************************************************************************/

	chess_data.forEach(d => {
		d.rated = Boolean(d.rated)
		d.turns = +d.turns
		d.white_rating = +d.white_rating
		d.black_rating = +d.black_rating
		d.moves = d.moves.split(" ")
	});

	var hm_width = 800, hm_height = 600;
	var left_pad = 40, right_pad = 40, y_pad = 40
	var hm_width = hm_width-(left_pad+right_pad), hm_height = hm_height-2*y_pad;

	d3.select('body').append('svg')
		.attr('width', 1400).attr('height', 1000)
		.attr('transform', 'translate(0,0)')
		// .append('rect')
		// 	.attr('fill','grey')
		// 	.attr('opacity',0.05)
		// 	.attr('width', 1.5*left_pad+hm_width+2.5*left_pad+hm_height/2.5+left_pad*3)
		// 	.attr('height', y_pad*4+hm_height+y_pad+hm_height/2.5-5)


	//USEFUL CONSTANTS:

	bg_color = d3.hcl(250,55,50,0.18)

	BLACK_COLOR = d3.lab(20, 0,0)
	WHITE_COLOR = d3.lab(130,0,0)
	DRAW_COLOR = d3.lab(d3.mean([BLACK_COLOR.l,WHITE_COLOR.l]),0,0)

/***********************************************************************************\
|*                                                                                 *|
|*                                     HEATMAP                                     *|
|*                                                                                 *|
\***********************************************************************************/

	d3.select('svg').append('g')
		.attr('transform', 'translate('+left_pad+','+(y_pad)+')')
		.attr('id', 'hm')
		.append('rect')
			.attr('width',hm_width)
			.attr('height',hm_height)
			.attr('fill',bg_color)
//generate_hm = function(chess_data) {
	/*-------------------------------------------------------------------------*\
	|*                             HEATMAP CONSTANTS                           *|
	\*-------------------------------------------------------------------------*/

	GAME_COUNT_LUM_RANGE  = [85,35]
	WIN_RATIO_COLOR_RANGE = [BLACK_COLOR.l,WHITE_COLOR.l]

 	/*-------------------------------------------------------------------------*\
	|*                            HEATMAP MOVE MATRIX                          *|
	\*-------------------------------------------------------------------------*/



	opening_move_matrix = {}
	white_move_domain = []
	black_move_domain = []

	for (game of chess_data) {
		white_move = game.moves[0], black_move = game.moves[1]

		white_move_domain.push(white_move)
		black_move_domain.push(black_move)

		if (typeof opening_move_matrix[white_move] === 'undefined') {
			opening_move_matrix[white_move] = {}
		}

		if (typeof opening_move_matrix[white_move][black_move] === 'undefined') {
			opening_move_matrix[white_move][black_move] = {
				'val': 0,
				'total_games': 0,
				'games_list': []
			}
		}

		opening_move_matrix[white_move][black_move]['total_games'] += 1
		opening_move_matrix[white_move][black_move]['games_list'].push(game)

		if (game.winner == 'white') {
			opening_move_matrix[white_move][black_move]['val'] += 1
		}
		else if (game.winner == 'black') {
			opening_move_matrix[white_move][black_move]['val'] -= 1
		}
	}

	for (white_move in opening_move_matrix) {
		for (black_move in opening_move_matrix[white_move]) {
			opening_move_matrix[white_move][black_move]['val'] /= opening_move_matrix[white_move][black_move]['total_games']
		}
	}

	white_move_domain = [...(new Set(white_move_domain))]
	black_move_domain = [...(new Set(black_move_domain))]

	flattened_move_matrix = []
	for (white_move of white_move_domain) {
		for (black_move of black_move_domain) {
			current_moves_info = opening_move_matrix[white_move][black_move]
			if (!(typeof current_moves_info === 'undefined')) {
				flattened_move_matrix.push( {
					white_move:white_move,
					black_move:black_move,
					val:current_moves_info['val'],
					games_count:current_moves_info['total_games'],
					games:current_moves_info['games_list']
				} )
			}
		}
	}

	/*-------------------------------------------------------------------------*\
	|*                               HEATMAP SCALES                            *|
	\*-------------------------------------------------------------------------*/

	hm_scale_x = d3.scaleBand()
			.domain(white_move_domain)
			.range([0,hm_width]).paddingInner(0.15).paddingOuter(0.15)

	hm_scale_y = d3.scaleBand()
			.domain(black_move_domain)
			.range([0,hm_height]).paddingInner(0.15).paddingOuter(0.15)

	win_scale = d3.scaleLinear()
			.domain([-1,1])
			.range(WIN_RATIO_COLOR_RANGE)

	win_scale_axis = d3.scaleLinear()
			.domain([-1,1])
			.range([hm_height-1,1])

	count_lum_scale = d3.scaleLog().base(20)
			.domain([1,d3.max(flattened_move_matrix.map(d => d.games_count))]).nice()
			.range(GAME_COUNT_LUM_RANGE)

	count_lum_scale_axis = d3.scaleLog().base(20)
		.domain(count_lum_scale.domain())
		.range([hm_height-1,0])

	/*-------------------------------------------------------------------------*\
	|*                               HEATMAP COLORS                            *|
	\*-------------------------------------------------------------------------*/

	games_count_color = function(games_num) {
		return d3.hcl(170,60,count_lum_scale(games_num))
	}
	games_count_color.mid = function() {return d3.hcl(170,60,d3.mean(count_lum_scale.range()))}
	games_count_color.min = function() {return d3.hcl(170,60,count_lum_scale.range()[0])}
	games_count_color.max = function() {return d3.hcl(170,60,count_lum_scale.range()[1])}

	win_color = function(win_var) {
		return d3.lab(win_scale(win_var),0,0)
	}
	win_color.mid = function() {return d3.lab(d3.mean(win_scale.range()),0,0)}
	win_color.min = function() {return d3.lab((win_scale.range()[0]),0,0)}
	win_color.max = function() {return d3.lab((win_scale.range()[1]),0,0)}

	/*-------------------------------------------------------------------------*\
	|*                              HEATMAP CELLS                              *|
	\*-------------------------------------------------------------------------*/

	d3.select('#hm').selectAll('.hm_squares').remove()

	hm_squares = d3.select('#hm').selectAll('.hm_squares').data(flattened_move_matrix)

	hm_squares.enter().append('rect')
		.attr('class', 'hm_squares')
		.attr('x',d => hm_scale_x(d.white_move)).attr('width', hm_scale_x.bandwidth())
		.attr('y',d => hm_scale_y(d.black_move)).attr('height',hm_scale_y.bandwidth())
		.attr('fill', d => win_color(d.val))

	cur_mode = "wins"

	/*-------------------------------------------------------------------------*\
	|*                              HEATMAP AXES                               *|
	\*-------------------------------------------------------------------------*/

	d3.select('#hm').append('g')
		.attr('id', 'topaxis')
		.attr('transform', 'translate(0,'+(0)+')')
		.call(d3.axisTop(hm_scale_x))

	d3.select('#hm').append('text')
		.attr('id', 'x_label')
		.attr('x', hm_width/2)
		.attr('y', -22)
		.text('White Move')
		.attr('text-anchor', 'middle')


	d3.select('#hm').append('g')
		.attr('id', 'leftaxis')
		.attr('transform', 'translate(0,'+(0)+')')
		.call(d3.axisLeft(hm_scale_y))

	d3.select('#hm').append('text')
		.attr('id', 'y_label')
		.attr('x', -hm_height/2)
		.attr('y', -28)
		.attr('transform', 'rotate(270)')
		.text('Black Move')
		.attr('text-anchor', 'middle')


	/*-------------------------------------------------------------------------*\
	|*                              HEATMAP TITLE                              *|
	\*-------------------------------------------------------------------------*/

	d3.select('#hm').append('text')
		.attr('id', 'title')
		.attr('x', hm_width/2)
		.attr('y', hm_height+y_pad/2+3)
		.text('Game Outcomes By Opening Moves')
		.attr('text-anchor', 'middle')
		.attr('font-size', 20)


	/*-------------------------------------------------------------------------*\
	|*                           HEATMAP COLOR LEGEND                          *|
	\*-------------------------------------------------------------------------*/

	win_gradient = d3.select('#hm').append('linearGradient')
	            .attr('id', 'win_gradient')
	            .attr('x1', '0%')
	            .attr('y1', '100%')
	            .attr('x2', '0%')
	            .attr('y2', '0%')

	    win_gradient.append('stop')
	            .attr('offset', '0%')
	            .attr('stop-color', win_color.min())
	            .attr('stop-opacity', 1)
	    win_gradient.append('stop')
	            .attr('offset', '100%')
	            .attr('stop-color', win_color.max())
	            .attr('stop-opacity', 1)

	game_count_gradient = d3.select('#hm').append('linearGradient')
	            .attr('id', 'game_count_gradient')
	            .attr('x1', '0%')
	            .attr('y1', '100%')
	            .attr('x2', '0%')
	            .attr('y2', '0%')

	    game_count_gradient.append('stop')
	            .attr('offset', '0%')
	            .attr('stop-color', games_count_color.min())
	            .attr('stop-opacity', 1)
	    game_count_gradient.append('stop')
	            .attr('offset', '100%')
	            .attr('stop-color', games_count_color.max())
	            .attr('stop-opacity', 1)

	d3.select('#hm').append('g')
		.attr('id', 'color_legend_group')
		.attr('transform', 'translate('+(hm_width+left_pad/2)+',0)')
		.append('rect')
			.attr('id', 'color_legend')
			.attr('width', (left_pad))
			.attr('height',(hm_height))
			.attr('fill','url(#win_gradient)')
			//.attr('stroke','blue')

	win_tickFormat = (d => {
			if (d == 1) {return "1:0"}
			else if (d == -1) {return "0:1"}
			else if (d == 0) {return "1:1"}
			else {return ""}
		})


	d3.select('#color_legend_group').append('g')
		.attr('id', 'rightaxis')
		.attr('transform', 'translate('+(y_pad)+',0)')
		.call(d3.axisRight(win_scale_axis).tickFormat(win_tickFormat))

	d3.select('#color_legend_group').append('text')
		.attr('id', 'label')
		.attr('x', hm_height/2)
		.attr('y', -left_pad*1.8)
		.attr('transform', 'rotate(90)')
		.text('White Wins : Black Wins')
		.attr('text-anchor', 'middle')


	/*-------------------------------------------------------------------------*\
	|*                           HEATMAP MODE BUTTON                           *|
	\*-------------------------------------------------------------------------*/

	d3.select('#hm').append('polygon')
		.attr('id', 'hm_button')
		.attr('points', (-left_pad-5)+","+(-y_pad-5)+" 10,"+(-y_pad-5)+" "+(-left_pad-5)+",10")
		.attr('fill', games_count_color.mid())

	d3.select('#hm').append('text')
		.attr('id', 'hm_button_label')
		.text('Switch Mode')
		.attr('pointer-events', 'none')
		.attr('x', (0)).attr('y',(-14.5))
		.attr('font-size', 11.8)
		.attr('text-anchor', 'middle')
		.attr('transform', 'rotate(-45)')

	swap_hm = function () {
		hm_squares2 = d3.select('#hm').selectAll('.hm_squares')
		hm_button = d3.select('#hm_button')
		hm_title = d3.select('#hm').select('#title')
		color_legend = d3.select('#color_legend')
		color_legend_axis = d3.select('#color_legend_group').select('#rightaxis')
		color_legend_label = d3.select('#color_legend_group').select('#label')
		if (cur_mode == "wins") {
			hm_squares2.transition().duration(300)
				.attr('fill', d => games_count_color(d.games_count))
			hm_button.transition().duration(300)
				.attr('fill', win_color.mid())
			hm_title
				.text('Total Games Played By Opening Moves')
			color_legend
				.attr('fill', d => 'url(#game_count_gradient)')
			color_legend_axis
				.call(d3.axisRight(count_lum_scale_axis))
			color_legend_label
				.text('Total Games Played')
			cur_mode = "count"
		}
		else if (cur_mode == "count") {
			hm_squares2.transition().duration(300)
				.attr('fill', d => win_color(d.val))
			hm_button.transition().duration(300)
				.attr('fill', games_count_color.mid())
			hm_title
				.text('Game Outcomes By Opening Moves')
			color_legend
				.attr('fill', d => 'url(#win_gradient)')
			color_legend_axis
				.call(d3.axisRight(win_scale_axis).tickFormat(win_tickFormat))
			color_legend_label
				.text('White Wins : Black Wins')
			cur_mode = "wins"
		}
	}

	hm_button = d3.select('#hm_button')
	hm_button.on('click', swap_hm);

//}


	/*-------------------------------------------------------------------------*\
	|*                          HEATMAP INTERACTIVITY                          *|
	\*-------------------------------------------------------------------------*/

	hm_squares = d3.select('#hm').selectAll('.hm_squares')
	square_selected = false

	hm_on_mouseover = function () {
		//hm_squares.attr('stroke-opacity', 0)
		if (!square_selected) {
			cur_square = d3.select(this)
			cur_data = cur_square.data()
			cur_square
				.attr('stroke-opacity', 1)
				.attr('stroke', d3.hcl(315,85,60))
				.attr('stroke-width', 2.5)
			//console.log(cur_data)
			makeEloBars(cur_data[0].games);
			make_info_box(cur_data[0].games)
			update_chess_pieces(cur_data[0].white_move, cur_data[0].black_move)
		}
	}
	hm_on_mouseout = function () {
		if (!square_selected) {
			hm_squares.attr('stroke-opacity', 0)
			makeEloBars(chess_data);
			make_info_box(chess_data)
			update_chess_pieces()
		}
	}

	hm_on_click = function () {
		if (!square_selected) {square_selected = true}
		else if (square_selected) {square_selected = false}
	}

	hm_squares.on('mouseover', hm_on_mouseover)
	hm_squares.on('mouseout', hm_on_mouseout)
	hm_squares.on('click', hm_on_click)

/***********************************************************************************\
|*                                                                                 *|
|*	                                   ELO BARS                                    *|
|*                                                                                 *|
\***********************************************************************************/
// alternate elo width : hm_width+left_pad*3+hm_width/2.5
// Cell Selection SVG
	var elo_bars_width = hm_width+left_pad*1.5
	var elo_bars_height = hm_width/2.5//400;
	d3.select('svg').append('g')
		.attr('transform', 'translate('+(left_pad)+','+(y_pad*2+hm_height)+')')
		.attr('id', 'elo_bars')
		.append('rect')
			.attr('width',elo_bars_width)
			.attr('height',elo_bars_height)
			.attr('fill', bg_color)



	/*-------------------------------------------------------------------------*\
	|*                              ELO BARS AXES                               *|
	\*-------------------------------------------------------------------------*/

	d3.select('#elo_bars').append('g')
		.attr('id', 'bottomaxis')
		.attr('transform', 'translate(0,'+(elo_bars_height)+')')

	d3.select('#elo_bars').append('g')
		.attr('id', 'leftaxis')
		.attr('transform', 'translate(0,'+(0)+')')

	//Interactivity for eloBars

makeEloBars = function(games_list){

		d3.select('#elo_bars').selectAll('text').remove()

		// each scale works the same for white and black players
		// white and black bars side by side in each bucket representing playertime
		var barData = [];
		var bucketArray = [];
		var numBuckets = 20;
		var curLo = 701
		var q;
		for (q = 0 ; q < numBuckets ; q++){
			bucketArray.push(curLo);
			curLo = curLo + 100;
		}

		var curWhiteElo;
		var wEloArray = new Array(numBuckets).fill(0);
		var wEloBucket;
		var curBlackElo;
		var bEloArray = new Array(numBuckets).fill(0);
		var bEloBucket;
		games_list.forEach(d =>{
			var barDatum = {};
			barDatum.white_rating = d.white_rating;
			barDatum.black_rating = d.black_rating;
			wEloBucket = 0;
			curWhiteElo = d.white_rating;
			bEloBucket = 0;
			curBlackElo = d.black_rating;
			while(curWhiteElo > 800){
				wEloBucket = wEloBucket + 1;
				curWhiteElo = curWhiteElo - 100;
			}
			while(curBlackElo > 800){
				bEloBucket = bEloBucket + 1;
				curBlackElo = curBlackElo - 100;
			}
			wEloArray[wEloBucket] = (wEloArray[wEloBucket] + 1);
			bEloArray[bEloBucket] = (bEloArray[bEloBucket] + 1);
			barData.push([barDatum.white_rating , barDatum.black_rating]);
		});


		var wElo_data = []
		var wEloForScale = []

		for(var j = 0 ; j < numBuckets ; j++){
			var wEloDatum = {};
			wEloDatum.eloRange = bucketArray[j];
			wEloDatum.numPlayers = wEloArray[j];
			wElo_data.push([wEloDatum.eloRange , wEloDatum.numPlayers]);
			wEloForScale.push(wEloDatum);
		}

		var bElo_data = []

		for(var j = 0 ; j < numBuckets ; j++){
			var bEloDatum = {};
			bEloDatum.eloRange = bucketArray[j];
			bEloDatum.numPlayers = bEloArray[j];
			bElo_data.push([bEloDatum.eloRange , bEloDatum.numPlayers]);
		}
		elo_bars_height_domain = d3.extent([d3.min(wEloArray) , d3.min(bEloArray) , d3.max(wEloArray) , d3.max(bEloArray)])
		elo_bars_height_domain[1] *= 1.1
		elo_bars_height_scale = d3.scaleLinear()
				.domain(elo_bars_height_domain)
				.range([elo_bars_height , 0]);

		elo_bars_bucket_scale = d3.scaleBand()
				.domain(bucketArray)
				.range([0,elo_bars_width]).paddingInner(0.15).paddingOuter(0.15);

	//var eloBarGroup = d3.select('#elo_bars');
	white_elo_bars = d3.select('#elo_bars').selectAll('.white_elo_bars').data(wElo_data);
	black_elo_bars = d3.select('#elo_bars').selectAll('.black_elo_bars').data(bElo_data);

	white_elo_bars.enter().append('rect')
	.attr('class' , 'white_elo_bars')
	.attr('x', d => elo_bars_bucket_scale(d[0]))
	.attr('y', d => elo_bars_height_scale(d[1]))
	.attr('width', elo_bars_bucket_scale.bandwidth() / 2 - 2)
	.attr('height', d => elo_bars_height - elo_bars_height_scale(d[1]))
	.attr('fill', WHITE_COLOR)
	.attr('opacity' , '1');

	black_elo_bars.enter().append('rect')
	.attr('class' , 'black_elo_bars')
	.attr('x', d => elo_bars_bucket_scale(d[0]) + elo_bars_bucket_scale.bandwidth() / 2 + 2)
	.attr('y', d => elo_bars_height_scale(d[1]))
	.attr('width', elo_bars_bucket_scale.bandwidth() / 2 - 2)
	.attr('height', d => elo_bars_height - elo_bars_height_scale(d[1]))
	.attr('fill', BLACK_COLOR)
	.attr('opacity' , '1');

	white_elo_bars.transition().duration(500)
	.attr('class' , 'white_elo_bars')
	.attr('x', d => elo_bars_bucket_scale(d[0]))
	.attr('y', d => elo_bars_height_scale(d[1]))
	.attr('width', elo_bars_bucket_scale.bandwidth() / 2 - 2)
	.attr('height', d => elo_bars_height - elo_bars_height_scale(d[1]))
	.attr('fill', WHITE_COLOR)
	.attr('opacity' , '1');

	black_elo_bars.transition().duration(500)
	.attr('class' , 'black_elo_bars')
	.attr('x', d => elo_bars_bucket_scale(d[0]) + elo_bars_bucket_scale.bandwidth() / 2 + 2)
	.attr('y', d => elo_bars_height_scale(d[1]))
	.attr('width', elo_bars_bucket_scale.bandwidth() / 2 - 2)
	.attr('height', d => elo_bars_height - elo_bars_height_scale(d[1]))
	.attr('fill', BLACK_COLOR)
	.attr('opacity' , '1');

	d3.select('#elo_bars').select('#bottomaxis')
	.call(d3.axisBottom(elo_bars_bucket_scale).tickFormat(d => {
		return ""
	}))

	d3.select('#elo_bars').append('text')
		.attr('id' , 'bottom_label')
		.attr('x', elo_bars_width/2)
		.attr('y', elo_bars_height+50)
		.text('ELO Score Range')
		.attr('font-size', 15)
		.attr('text-anchor', 'middle')

	d3.select('#elo_bars').selectAll('.bottomaxis_labels').data(bucketArray).enter().append('text')
		.attr('class' , 'bottomaxis_labels')
		.attr('x', d => elo_bars_bucket_scale(d)+elo_bars_bucket_scale.bandwidth()/2)
		.attr('y', elo_bars_height+15)
		.text(d => String(d))
		.attr('font-size', 10)
		.attr('text-anchor', 'middle')

	d3.select('#elo_bars').selectAll('.bottomaxis_labels2').data(bucketArray).enter().append('text')
		.attr('class' , 'bottomaxis_labels2')
		.attr('x', d => elo_bars_bucket_scale(d)+elo_bars_bucket_scale.bandwidth()/2)
		.attr('y', elo_bars_height+21)
		.text('–')
		.attr('font-size', 10)
		.attr('text-anchor', 'middle')

	d3.select('#elo_bars').selectAll('.bottomaxis_labels3').data(bucketArray).enter().append('text')
		.attr('class' , 'bottomaxis_labels3')
		.attr('x', d => elo_bars_bucket_scale(d)+elo_bars_bucket_scale.bandwidth()/2)
		.attr('y', elo_bars_height+29)
		.text(d => String(d+99))
		.attr('font-size', 10)
		.attr('text-anchor', 'middle')


	d3.select('#elo_bars').select('#leftaxis')
	.call(d3.axisLeft(elo_bars_height_scale).tickFormat(d => {
		if(Number.isInteger(d)){
			return d;
		} else{
			return "";
		}}))
}


makeEloBars(chess_data);


// FOR BUCKETS, MAKE THEM 100 EACH, MIN IS 701 MAX IS 2700
//        (I.E. [701-800,801-900,...,2501-2600,2601-2700])

	//band scale for the y axis (ELO buckets)
		// Domain is from min to max ELO divided into segments (determine segments after seeing max & min)
		// Range is from min to max y value (top to bottom of eloBar)

	//linear scale for the x axis (each matchup's ELO distribution)
		// Domain is from 0 to 100% of players in each bucket
		// Range is from min to max x value (left to right of eloBar)

/***********************************************************************************\
|*                                                                                 *|
|*	                                   INFO BOX                                    *|
|*                                                                                 *|
\***********************************************************************************/


	var info_box_width = hm_width/2.5//400;
	var info_box_height = hm_height
	d3.select('svg').append('g')
		.attr('transform', 'translate('+(1.5*left_pad+hm_width+2.5*left_pad)+','+(y_pad)+')')
		.attr('id', 'info_box')
		.append('rect')
			.attr('width',info_box_width)
			.attr('height',info_box_height)
			.attr('fill',bg_color)

	make_info_box = function(games_list) {
		total_white_wins 	= 0
		total_black_wins 	= 0
		total_draws 	 	= 0

		for (game of games_list){
			if (game.winner == 'white') {
				total_white_wins += 1
			}
			else if (game.winner == 'black') {
				total_black_wins += 1
			}
			else {
				total_draws += 1
			}
		}

		pie_data = {white:total_white_wins, black:total_black_wins, draws:total_draws}

		pie_colors = d3.scaleOrdinal()
		  .domain(pie_data)
		  .range([WHITE_COLOR, BLACK_COLOR, DRAW_COLOR])

		pie_chart = d3.pie().value(d => d.value)(d3.entries(pie_data))

		d3.select('#info_box').selectAll('.pie_chart').remove()
		d3.select('#info_box').selectAll('.pie_chart').data(pie_chart).enter().append('path')
			.attr('class', 'pie_chart')
			.attr('transform', 'translate('+info_box_width/2+','+info_box_height*0.35+')')
			.attr('d', d3.arc()
		    	.innerRadius(0)
		   		.outerRadius(info_box_width/2 - 30)
			)
			.attr('fill', d => pie_colors(d.data.key))
			.style("opacity", 1)

		d3.select('#info_box').select('#pie_title').remove()
		d3.select('#info_box').append('text')
			.attr('id', 'pie_title')
			.attr('x', info_box_width/2)
			.attr('y', info_box_height*0.08)
			.text('Game Outcomes')
			.attr('text-anchor', 'middle')
			.attr('font-size', 22)

		d3.select('#info_box').selectAll('.info_text').remove()

		d3.select('#info_box').append('text')
			.attr('class', 'info_text')
			.attr('x', info_box_width/2)
			.attr('y', info_box_height-165)
			.text('Total Games Played: ' + String(total_white_wins+total_black_wins+total_draws))
			.attr('text-anchor', 'middle')
			.attr('font-size', 18)

		d3.select('#info_box').append('text')
			.attr('class', 'info_text')
			.attr('x', info_box_width/2)
			.attr('y', info_box_height-110)
			.text('White Wins: ' + String(total_white_wins))
			.attr('text-anchor', 'middle')

		d3.select('#info_box').append('text')
			.attr('class', 'info_text')
			.attr('x', info_box_width/2)
			.attr('y', info_box_height-80)
			.text('Black Wins: ' + String(total_black_wins))
			.attr('text-anchor', 'middle')

		d3.select('#info_box').append('text')
			.attr('class', 'info_text')
			.attr('x', info_box_width/2)
			.attr('y', info_box_height-50)
			.text('Draws: ' + String(total_draws))
			.attr('text-anchor', 'middle')

	}
	make_info_box(chess_data)

//TO-DO:
//       -FIGURE OUT WHAT INFO TO INCLUDE
//             (I.E. OPENING NAMES, TOTAL GAMES PLAYED, AVERAGE NUMBER OF MOVE BEFORE END OF GAME, ...?)
//		 -MAKE DICTIONARY TO GET OPENING NAME FROM OPENING_ECO (OR FROM MOVES PLAYED)
//		 -MAKE CHART DISPLAYING RELATIVE BLACK VICTORIES, WHITE VICTORIES, DRAWS (BAR CHART? PIE CHART?)
//       -LABELS AND SUCH


/***********************************************************************************\
|*                                                                                 *|
|*	                                  CHESS BOARD                                  *|
|*                                                                                 *|
\***********************************************************************************/


	var chess_board_len = hm_width/2.5//400;
	d3.select('svg').append('g')
		.attr('transform', 'translate('+(1.5*left_pad+hm_width+2.5*left_pad)+','+(y_pad*2+hm_height)+')')
		.attr('id', 'chess_board')
		.append('rect')
			.attr('width',chess_board_len)
			.attr('height',chess_board_len)
			.attr('fill',bg_color)

	CHESS_BOARD_ROWS = [1,2,3,4,5,6,7,8]
	CHESS_BOARD_COLS = ['a','b','c','d','e','f','g','h']
	chess_board_scale_x = d3.scaleBand()
			.domain(CHESS_BOARD_COLS)
			.range([0,chess_board_len]).paddingInner(0).paddingOuter(0.35)

	chess_board_scale_y = d3.scaleBand()
			.domain(CHESS_BOARD_ROWS)
			.range([chess_board_len,0]).paddingInner(0).paddingOuter(0.35)


	chess_board_data = []
	for (row of CHESS_BOARD_ROWS) {
		for (col of CHESS_BOARD_COLS) {
			chess_board_data.push({row: row, col: col, piece_side: null, piece: null})
		}
	}

	for (square of chess_board_data) {
		if (square.row == 1 || square.row == 2) {
			square.piece_side = 'white'
		}
		else if (square.row == 7 || square.row == 8) {
			square.piece_side = 'black'
		}
		if (square.row == 2 || square.row == 7) {
			square.piece = 'pawn'
		}
		else if (square.row == 1 || square.row == 8) {
			if (square.col == 'a' || square.col == 'h') {
				square.piece = 'rook'
			}
			else if (square.col == 'b' || square.col == 'g') {
				square.piece = 'knight'
			}
			else if (square.col == 'c' || square.col == 'f') {
				square.piece = 'bishop'
			}
			else if (square.col == 'd') {
				square.piece = 'queen'
			}
			else if (square.col == 'e') {
				square.piece = 'king'
			}
		}
	}

	//console.log(chess_board_data)

	chess_board = d3.select('#chess_board').selectAll('.chess_board_squares').data(chess_board_data)
	cur_color_code = 1
	chess_board.enter().append('rect')
		.attr('class', 'chess_board_squares')
		.attr('x', d => chess_board_scale_x(d.col))
		.attr('y', d => chess_board_scale_y(d.row))
		.attr('width', chess_board_scale_x.bandwidth)
		.attr('height', chess_board_scale_y.bandwidth)
		.attr('fill', d => {
			if (cur_color_code == 0) {
				if (d.col != 'h') {cur_color_code += 1}
				return d3.hcl(255,40,90)
			}
			else if (cur_color_code == 1) {
				if (d.col != 'h') {cur_color_code -= 1}
				return d3.hcl(255,50,30)
			}
		})
	chess_pieces_data = []
	for (square of chess_board_data) {
		if (square.piece != null) {
			chess_pieces_data.push(square)
		}
	}
	chess_pieces = d3.select('#chess_board').selectAll('.chess_pieces').data(chess_pieces_data)
	chess_pieces.enter().append('image')
		.attr('id', d => {return String(d.col) + String(d.row) + '-' + String(d.piece_side) + "-" + String(d.piece)})
		.attr('class', "chess_pieces")
		.attr('x', d => chess_board_scale_x(d.col))
		.attr('y', d => chess_board_scale_y(d.row))
		.attr('width', chess_board_scale_x.bandwidth)
		.attr('height', chess_board_scale_y.bandwidth)
		.attr('href', d => {return "images/" + String(d.piece_side) + "-" + String(d.piece) + ".png"})

	update_chess_pieces = function(white_move = null, black_move = null) {
		
		chess_pieces = d3.selectAll('.chess_pieces').data(chess_pieces_data)
			.transition().duration(10)
			.attr('id', d => {return String(d.col) + String(d.row) + "-" + String(d.piece_side) + "-" + String(d.piece)})
			.attr('x', d => chess_board_scale_x(d.col))
			.attr('y', d => chess_board_scale_y(d.row))
				//.attr('href', d => {return "images/" + String(d.piece_side) + "-" + String(d.piece) + ".png"})
		
		if (white_move != null && black_move != null) {
			//white_piece_to_move = 'pawn'
			if (white_move[0] == 'N') {
				white_piece_to_move = 'knight'
				new_white_col = white_move[1]
				new_white_row = Number(white_move[2])

				white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) + 1) + String(new_white_row + 2) + '-white-' + white_piece_to_move)
				if (white_piece_select._groups[0][0] == null) {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) + 1) + String(new_white_row - 2) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null && new_white_col != 'a') {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) - 1) + String(new_white_row + 2) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null && new_white_col != 'a') {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) - 1) + String(new_white_row - 2) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null) {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) + 2) + String(new_white_row + 1) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null) {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) + 2) + String(new_white_row - 1) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null && new_white_col != 'a' && new_white_col != 'b') {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) - 2) + String(new_white_row + 1) + '-white-' + white_piece_to_move)
				}
				if (white_piece_select._groups[0][0] == null && new_white_col != 'a' && new_white_col != 'b') {
					white_piece_select = d3.select('#' + String.fromCharCode(new_white_col.charCodeAt(0) - 2) + String(new_white_row - 1) + '-white-' + white_piece_to_move)
				}
			}
			else {
				white_piece_to_move = 'pawn'
				new_white_col = white_move[0]
				new_white_row = white_move[1]

				white_piece_select = d3.select('#' + new_white_col + String(new_white_row - 1) + '-white-' + white_piece_to_move)
				if (white_piece_select._groups[0][0] == null) {
					white_piece_select = d3.select('#' + new_white_col + String(new_white_row - 2) + '-white-' + white_piece_to_move)
				}
			}

			//console.log(black_move)
			if (black_move[0] == 'N') {
				black_piece_to_move = 'knight'
				new_black_col = black_move[1]
				new_black_row = Number(black_move[2])

				black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) + 1) + String(new_black_row + 2) + '-black-' + black_piece_to_move)
				if (black_piece_select._groups[0][0] == null) {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) + 1) + String(new_black_row - 2) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null && new_black_col != 'a') {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) - 1) + String(new_black_row + 2) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null && new_black_col != 'a') {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) - 1) + String(new_black_row - 2) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null) {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) + 2) + String(new_black_row + 1) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null) {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) + 2) + String(new_black_row - 1) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null && new_black_col != 'a' && new_black_col != 'b') {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) - 2) + String(new_black_row + 1) + '-black-' + black_piece_to_move)
				}
				if (black_piece_select._groups[0][0] == null && new_black_col != 'a' && new_black_col != 'b') {
					black_piece_select = d3.select('#' + String.fromCharCode(new_black_col.charCodeAt(0) - 2) + String(new_black_row - 1) + '-black-' + black_piece_to_move)
				}
			}
			else {
				black_piece_to_move = 'pawn'
				new_black_col = black_move[0]
				new_black_row = black_move[1]

				black_piece_select = d3.select('#' + new_black_col + String(Number(new_black_row) + 1) + '-black-' + black_piece_to_move)
				if (black_piece_select._groups[0][0] == null) {
					black_piece_select = d3.select('#' + new_black_col + String(Number(new_black_row) + 2) + '-black-' + black_piece_to_move)
				}
			}
			//console.log('#' + new_black_col + String(Number(new_black_row) + 1) + '-black-pawn')
				
				//console.log(black_piece_select)
			white_piece_select.transition().duration(20)
				.attr('id', new_white_col + String(new_white_row) + '-white-' + white_piece_to_move)
				.attr('x', chess_board_scale_x(new_white_col))
				.attr('y', chess_board_scale_y(new_white_row))

			black_piece_select.transition().duration(20)
				.attr('id', new_black_col + String(new_black_row) + '-black-' + black_piece_to_move)
				.attr('x', chess_board_scale_x(new_black_col))
				.attr('y', chess_board_scale_y(new_black_row))
			
		}
	}
}
