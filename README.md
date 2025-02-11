# Data-Vis-Group-Project

## Overview

This project asks the question: What choices can chess players make to maximize their chance of winning? 

To answer this question, we designed a data visualization that would allow users to study various opening chess moves and see likelihood of winning with respect to factors such as ELO score (which represents the skill of a player), chess color, and win percentages.

The chess data was collected from over 20,000 chess games from LiChess, source: https://www.kaggle.com/datasnaek/chess

To run this project, download or clone the repository, and navigate to the top-level directory through Terminal. It should be named Data-Vis-Group-Project-master. If you are running python2.x, then issue: python -m SimpleHTTPServer in your application. If you are running python3.x, then issue: python -m http.server. You will now be running a local server on your machine.

Open up your Google Chrome browser and go to the following URL: http://localhost:8000/Data-Vis-Group-Project-master.

## Interactivity

The main way of interacting with our visualization is through the heatmap.

The user can hover over individual squares of the heatmap to select them, which will adjust the other visualizations (the info box, chess board, and ELO bar chart) to match the subset of data associated with the selected square.  In addition, the user may click on a square to "lock it in", which essentially disables the hover interaction while leaving the square selected, allowing the user to freely move their mouse without changing any of the other visualizations.  To return to the normal mode of hover interactivity, simply click on the selected square a second time.

In addition to the above, the user can press the _Switch Mode_ button in the upper left to swap the heatmap coloring between a visualization of the number of games, and the outcomes of the games.

## What's Included?

Essentially all of our code in located in the `chess-project.js` file, and the only library we use is `d3.js`.  

Our data is contained in `chess.zip` and `games.csv`, and `games_without_duplicated` is a cleaned version of the data with duplicates removed.  `chess_data.db` is an SQL database of the data, used in performing the aforementioned cleaning.

As you would expect, our process book is located in `Process Book.pdf`.

Finally, the `images` folder contains the png images used to display the pieces in the chess board visualization.
