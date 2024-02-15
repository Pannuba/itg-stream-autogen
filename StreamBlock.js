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
	}
	
	//TODO use same function for first and last measure
	addFirstLastMeasure(measure, finalStream, count, isLastMeasure = false)
	{
		var converted = this.convertMeasure(measure)
		var write = (isLastMeasure ? true : false);
		
		for (let i = 0; i < converted.length; i++)
		{
			if (converted[i] == "2222" || converted[i] == "4444")
				write = true;
			
			if (converted[i] == "3333")
			{
				finalStream.push(this.arrows[count++]);
				i++;
				write = false;
			}
			
			if (write)
				finalStream.push(this.arrows[count++]);
			
			else finalStream.push(converted[i]);
		}
		
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
	
	// Returns true if the first measure contains 3333 (only one measure of generated stream)
	isOneMeasure()
	{
		for (const arrow of this.firstMeasure)
		{
			if (arrow == "3333")
				return true;
		}
		
		return false;
	}
	
	// TODO rename
	addCommas()	// Puts the ',' every *quantization* arrows (e.g. , every 16 arrows)
	{
		var finalStream = [];
		var count = 0;
		
		
		[finalStream, count] = this.addFirstLastMeasure(this.firstMeasure, finalStream, count);

		if (!this.isOneMeasure())
		{
			finalStream.push(",");
			
			for (let i = 0; i < this.measures - 2; i++)	// Even if there are excess arrows, it only gives the exact measures
			{
				for (let j = 0; j < this.quantization; j++)
				{
					finalStream.push(this.arrows[count++])
				}

				finalStream.push(',');
			}
			
			[finalStream, count] = this.addFirstLastMeasure(this.lastMeasure, finalStream, count, true);
		}
		
		return finalStream;
	}
}
