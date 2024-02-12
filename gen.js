// Patterns that start with a foot, and the next one starts with the left arrow
const nextArrowLeftPatterns = ['LDUR', 'LUDR', 'RUDUR', 'RDUDR', 'RUR', 'RDR', 'RDULUDR', 'RUDLDUR']
// Patterns that start with a foot, and the next one starts with the right arrow
const nextArrowRightPatterns = ['RUDL', 'RDUL', 'LDUDL', 'LUDUL', 'LUL', 'LDL', 'LDURUDL', 'LUDRDUL']
// Patterns that start with left
const startFromLeftPatterns = {'LDUR' : 28, 'LUDR' : 28, 'LDUDL' : 4, 'LUDUL' : 4, 'LUL' : 16, 'LDL' : 16, 'LDURUDL' : 2, 'LUDRDUL' : 2}
// Yeah
const startFromRightPatterns = {'RUDL' : 28, 'RDUL' : 28, 'RUDUR' : 4, 'RDUDR' : 4, 'RUR' : 16, 'RDR' : 16, 'RDULUDR': 2, 'RUDLDUR' : 2}
// Candle down with left or right foot
const candleDownDict = {'D' : 40, 'DU' : 50, 'DUD' : 10 }
// Candle up with left or right foot
const candleUpDict = {'U' : 40, 'UD' : 50, 'UDU' : 10 } // 30 60 10

const arrowsDict = {'L' : '1000', 'D' : '0100', 'U' : '0010', 'R' : '0001'}
// Last N patterns (3 for now). If a pattern to be added is in this list, it is discarded
var lastPatterns = ['X', 'X']	// Initialize with dummy values. Make part of StreamBlock?

function generateStream(measures, options, firstArrow)
{

	stream = new StreamBlock(measures, options["quantization"], firstArrow);

	// Doesn't have to be precise, not a problem if it generates more than needed
	arrowsToGenerate = measures * options["quantization"]; // TODO(?): move in StreamBlock class

	addPattern(true, stream);

	while (arrowsToGenerate > 0)
	{
		// TODO: implement random thing like tetris where after every n ALWAYS pick candle
		stream = addPattern(Math.floor(Math.random() * options["candleDens"]), stream, options);	// if 0 candle, if > 0 no
		arrowsToGenerate -= stream.lastPattern.length;
	}

	return stream;
}

function addPattern(isNotCandle = true, stream, options)	// TODO: find a way to only pass options and not make the first pattern a candle (easy)
{
	var pattern = "";
	
	if (isNotCandle)
	{
		console.log("adding no");
		do {
			pattern = chooseNextPattern((stream.nextArrow == 'L') ? startFromLeftPatterns : startFromRightPatterns)	
		} while (lastPatterns.includes(pattern))
	}

	else	// isNotCandle is not zero. TODO(?) balance candles more (aka after x patterns if still no candle add one
	{
		var secondToLastArrow = stream.lastPattern.slice(-2, -1), candlePattern;

		(secondToLastArrow == 'U') ? candlePattern = chooseNextPattern(candleDownDict) : candlePattern = chooseNextPattern(candleUpDict);

		// TODO make function
		convertPatternToList(candlePattern).forEach(arrow => {
			stream.arrows.push(arrow);
		});

		// Gets stuck if I put the lastPatterns check. Fixed by reducing lastPatterns to 2 from 3.

		if (candlePattern.length == 2)
		{
			if (Math.floor(Math.random() * 3) && !options['wtfMode'])	// 2/3 of the time. Skips single candle for wtf mode
			{
				console.log("adding single candle");
				
				if (nextArrowLeftPatterns.includes(stream.lastPattern))
				{
					stream.arrows.push("1000");
					pattern = chooseNextPattern(startFromRightPatterns);
				}
				
				else
				{
					stream.arrows.push("0001");
					pattern = chooseNextPattern(startFromLeftPatterns);
				}
			}
			
			else	// 1/3rd of the time, double candle
			{
				console.log("adding double candle");
				
				do {
					pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromLeftPatterns : startFromRightPatterns);
				} while (pattern[1] == candlePattern[1]);
			}
		}
		
		else
		{
			console.log("adding double candle");
			
			do {
				pattern = chooseNextPattern(nextArrowLeftPatterns.includes(stream.lastPattern) ? startFromRightPatterns : startFromLeftPatterns);
			} while (pattern[1] == candlePattern.slice(-1));
		}
	}

	stream.lastPattern = pattern;

	lastPatterns.unshift(pattern);
	lastPatterns.pop(); // Keep the list with the same amount of elements

	console.log(pattern);

	(pattern.slice(-1) == 'R') ? stream.nextArrow = 'L' : stream.nextArrow = 'R';

	convertPatternToList(pattern).forEach(arrow => {
		stream.arrows.push(arrow);
	});
	
	return stream;
}

function chooseNextPattern(patternDict)
{
	var num = Math.floor(Math.random() * (100 - 1));	// 100 is the total weight

	for (const [pattern, weight] of Object.entries(patternDict))
	{
		if (num < weight) return pattern;

		num -= weight;
	}
}

// Converts "LUDL" to ["1000", "0100", "0010", "0001"]
function convertPatternToList(pattern)
{
	var list = [];

	for (const arrow of pattern)
	{
		list.push(arrowsDict[arrow])
	}

	return list;
}

// Called for each stream block. Writes the whole output chart
function getNewChart(stream, streamBegin, streamEnd, inputLines)
{
	var outputLines = [], streamLineCounter = 0, isStreamAdded = false;

	inputLines.forEach((line, i) => {
		if (i < streamBegin || i > (streamEnd - 1))	// We're before/after the generated stream
		{
			outputLines.push(line)
		}

		else if (!isStreamAdded)	// Put the generated stream instead of the quad hold
		{
			stream.addCommas().forEach((line, j) => {
				console.log("adding generated", line)
				outputLines.push(line);
			});
			
			isStreamAdded = true;
		}
	});

	return outputLines.join("\n");
}

// Looks at the arrows before the stream block to see if it should start with left or right
function findFirstArrow(lines, i)
{
	for (let j = i; j > 0; j--)	// goes back line by line from the 2222
	{
		if (["1000", "1100", "1010"].includes(lines[j])) return 'R';
		
		if (["0001", "0011", "0101"].includes(lines[j])) return 'L';

		if (lines[j] == "0010" || lines[j] == "0100")	// Builds pattern of last arrows, then analyses it
		{
			patt = [lines[j]];
			
			for (let k = --j; k > 0; k--)
			{
				if (["0100", "0010"].includes(lines[k]))
				{
					patt.unshift(lines[k]);
				}

				if (["1000", "0001"].includes(lines[k]))
				{
					patt.unshift(lines[k]);
					// If patt has an even number of arrows, firstArrow is the first one of patt (L/R). If odd, it's the opposite
					// TODO: remove duplicates in a row (jacks)
					if ( (patt.length % 2) && (patt[0] == "1000")) return 'R';
					if ( (patt.length % 2) && (patt[0] == "0001")) return 'L';
					if (!(patt.length % 2) && (patt[0] == "0001")) return 'R';
					if (!(patt.length % 2) && (patt[0] == "1000")) return 'L';
				}
			}
		}
	}

	return 'R';	// Fallback
}

function findStreamBegin(lines, i)
{
	var skipMeasure = false, gap = 0;

	for (let j = i - 1; j > 0; j--)	// goes back line by line from the 2222
	{
		if (lines[j] == ",") break;

		if (lines[j] != "0000")
		{
			console.log("skipping first measure");
			skipMeasure = true;
			break;
		}
	}

	if (skipMeasure)	// If there already are arrows in the measure where quad hold starts
	{
		lines[i] = "0000";	// Replace 2222 with empty space

		for (let j = i; lines[j] != ','; j++)	// Calculates distance between 2222 and beginning of next measure
			gap++;
		
		gap++;

		streamBegin = i + gap;	// i is the old 2222's position
	}

	else	// If 2222 is at beginning of measure, or there are only 0000 between , and 2222
	{
		console.log("not skipping first measure");
		lines[i] = "0000";

		for (let j = i - 1; lines[j] != ','; --j)	// Calculates distance between 2222 and beginning of current measure
			gap++;	// TODO: find this where i put comment "goes back line by line from 2222
		
		streamBegin = i - gap;	// gap must be 0 if 2222 is at beginning of measure!
	}

	return streamBegin;
}

function findStreamEnd(lines, i)
{
	streamEnd = i;
	lines[i] = "0000";

	var gap = 0;

	for (let j = i - 1; j > 0; j--)	// Goes from 3333 to the PREVIOUS ,
	{
		if (lines[j] == ",")
		{
			streamEnd -= gap;
			break;
		}

		gap++;
	}

	return streamEnd;
}

function main(chart, options)
{
	do {
		noMoreStreams = true;
		lines = chart.split('\n');	// List of strings, each one is a line

		var measures = 0, streamBegin = 0, streamEnd = 0, insideStream = false, firstArrow = '', quantization;
		for (let i = 0; i < lines.length; i++)
		{
			var line = lines[i];	// seta ultra

			if (line == "2222" || line == "4444")	// Start of quad hold
			{
				options["quantization"] = (line[0] == '2' ? options['quantHolds'] : options['quantRolls']);
				streamBegin = findStreamBegin(lines, i);
				firstArrow = findFirstArrow(lines, i);
				console.log("firstARROW", firstArrow);
				noMoreStreams = false;			
				insideStream = true;
			}

			if (insideStream && i >= streamBegin)	// Additional check if first measure was skipped (otherwise it creates one more measures bc it saw the comma)
			{
				console.log("processing line", line);

				if (line == ",") measures++;

				if (line == "3333")
				{
					streamEnd = findStreamEnd(lines, i, measures);

					insideStream = false;
					break;
				}
			}
		}

		console.log("start st: ", streamBegin, "\nend strm: ", streamEnd, "\nmeasures: ", measures)

		if (!noMoreStreams)
		{
			console.log(options)
			stream = generateStream(measures, options, firstArrow)
			chart = getNewChart(stream, streamBegin, streamEnd, lines);
		}
	} while (!noMoreStreams) // faking

	var blob = new Blob([chart], { type: 'text/plain' });
	var file = new File([blob], "output.sm", {type: "text/plain"});
	
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = URL.createObjectURL(file);
	link.download = file.name;
	document.body.appendChild(link);
	link.click();
}

function seParti()
{
	var chart = document.getElementById('chart').files[0];
	var quantHolds = document.getElementById('holds-quant').value;
	var quantRolls = document.getElementById('rolls-quant').value;
	var customQuantHolds = document.getElementById("customquant-holds").value;
	var customQuantRolls = document.getElementById("customquant-rolls").value;
	var candleDens = document.getElementById("candles").value;
	var wtfMode = (candleDens == 0) ? true : false;

	if (customQuantHolds && customQuantHolds != 0) quantHolds = customQuantHolds;
	if (customQuantRolls && customQuantRolls != 0) quantRolls = customQuantRolls;

	var options = {
		'quantHolds' : quantHolds,
		'quantRolls' : quantRolls,
		'candleDens' : candleDens,		// TODO: add candleDens for rolls
		'wtfMode' : wtfMode
	};

	var reader = new FileReader();

	reader.onload = (function() {
		return function(e) {
			main(e.target.result, options)
		};
	})(chart);

	reader.readAsText(chart);
}