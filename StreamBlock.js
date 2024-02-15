class StreamBlock {

	constructor(measures, quantization, firstArrow, firstMeasure, lastMeasure)
	{
		this.measures = measures;	// ALL measures including first and last, which may be skipped
		this.quantization = quantization;
		this.nextArrow = firstArrow;
		this.arrows = [];
		this.lastPattern = null;
		this.firstMeasure = firstMeasure;
		this.lastMeasure = lastMeasure;
		console.log("firstMeasure: ", firstMeasure);
		console.log("lastMeasure: ", lastMeasure);
		// if firstmeasure == lastMeasure, only add firstMeasure and skip everything else
	}
	
	//TODO use same function for first and last measure
	addFirstMeasure(finalStream, count)
	{
		var converted = this.convertMeasure(this.firstMeasure)
		var startWriting = false;
		
		if (this.isEmpty(converted))
		{
			console.log("first measure is empty");
			
			for (let i = 0; i < converted.length; i++)
			{
				if (converted[i] == "2222")
					startWriting = true;
				
				if (startWriting)
					finalStream.push(this.arrows[count++]);
				
				else finalStream.push("0000");
			}
		}
		
		else	// Just adds the old measure
		{
			for (let i = 0; i < this.firstMeasure.length; i++)
			{
				if (this.firstMeasure[i] == "2222")
					finalStream.push("0000");	// replace 3333 with 0
				
				else
					finalStream.push(this.firstMeasure[i]);
			}
		}
		
		finalStream.push(",");
		
		// TODO check commas include/exclude, indexes etc
		
		return [finalStream, count];
	}
	
	addLastMeasure(finalStream, count)
	{
		var converted = this.convertMeasure(this.lastMeasure)
		var stopWriting = false;
		
		if (this.isEmpty(converted))
		{
			console.log("last measure is empty");
			for (let i = 0; i < converted.length; i++)
			{
				if (converted[i] == "3333")
				{
					finalStream.push(this.arrows[count++]);
					stopWriting = true;
				}
				
				else if (!stopWriting)
					finalStream.push(this.arrows[count++]);
				
				else finalStream.push("0000");
			}
		}
		
		else	// Just adds the old measure. TEMPORARYYYYYYY
		{
			for (let i = 0; i < this.lastMeasure.length; i++)
			{
				if (this.lastMeasure[i] == "3333")
					finalStream.push("0000");	// replace 3333 with 0
				
				else
					finalStream.push(this.lastMeasure[i]);
			}
		}
		
		finalStream.push(",");	// Could also be ;, TODO
		
		// TODO check commas include/exclude, indexes etc
		
		return [finalStream, count];
	}
	
	// Converts a measure of xths to something that can fit xths and (quantization)ths
	// TODO: do this for existing arrows too (no if empty or not empty, ALWAYS!!!)
	// 16ths and 24ths --> 48ths
	// 16ths and 12ths --> 48ths
	convertMeasure(oldMeasure)
	{
		var newMeasure = [];
		var oldQuant = oldMeasure.length;
		
		var newQuant = this.findLCM(this.quantization, oldQuant);
		
		var jimmy = newQuant / oldQuant;
		// Empty measure was 12ths, I want to put 16ths. newQuant is 48, jimmy is 4
		// Empty measure was 4ths, I want to put 8ths. newQuant is 8, jimmy is 2
		
		console.log("jimmy: ", jimmy);
		
		for (let i = 0; i < oldMeasure.length; i++)
		{
			newMeasure.push(oldMeasure[i])
			
			for (let j = 0; j < jimmy - 1; j++)	// - 1 because the first arrow is copied from the old measure
			{
				newMeasure.push("0000");
			}
		}
		
		console.log("converted measure: ", newMeasure);
		return newMeasure;// Doesn't have commas
		
	}
	
	findLCM(a, b)	// x > y
	{
		var x = Math.max(a, b);
		var y = Math.min(a, b);
		
		var lcm = x;
		
		while (lcm % x > 0 || lcm % y > 0)
			lcm++;

		return lcm;
	}
	
	
	isEmpty(measure)
	{
		for (let i = 0; i < measure.length; i++)
		{
			if (!["2222", "3333", "0000"].includes(measure[i]))
			{
				return false;
			}
		}
		
		return true;
	}
	
	// TODO rename
	addCommas()	// Puts the ',' every *quantization* arrows (e.g. , every 16 arrows)
	{
		var finalStream = [];
		var count = 0;
		
		
		[finalStream, count] = this.addFirstMeasure(finalStream, count);

		for (let i = 0; i < this.measures - 2; i++)	// Even if there are excess arrows, it only gives the exact measures
		{
			for (let j = 0; j < this.quantization; j++)
			{
				finalStream.push(this.arrows[count++])
			}

			finalStream.push(',');
		}
		
		[finalStream, count] = this.addLastMeasure(finalStream, count);

		return finalStream;
	}
}
