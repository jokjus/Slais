// settings
let c = {
	debug: false,
	xSlices: 3,
	ySlices: 3,
	innerLine: false,
	lineFill: false,
	fillColor: new Color(0,0,0),
	strokeColor: new Color(1,1,1),
	strokeWidth: 5,
	lineFillWidth: 1,
	lineFillColor: new Color(0,0,0),
	lineFillFreq: 5,
	rounding: 40
}

let w = view.size.width,
	h = view.size.height

// Background
let bg = new Layer()

new Path.Rectangle({
	point: [0,0],
	size: [w, h],
	fillColor: 'white',
	parent: bg
})

// Init layers
let orig = new Layer({name:'orig'}) // the blob itself
let toolL = new Layer({name:'tool'}) // mouse drawing
let debug = new Layer({name:'debug'}) // debug elements
let draw = new Layer({name:'draw'}) // linefill, inner lines
orig.activate()


initScene()

function initScene() {
	orig.removeChildren()
	draw.removeChildren()
	debug.removeChildren()

	let ci = new Path.RegularPolygon({
		center: view.center,
		radius: 500,
		sides: 6,
		fillColor: c.fillColor,
		strokeColor: c.strokeColor,
		strokeWidth: c.strokeWidth

	})

	if (c.debug) {
		ci.fillColor = new Color(0,0,0,.1)
		ci.strokeColor = 'magenta'
		ci.strokeWidth = 1
	}

	ci.smooth({ type: 'catmull-rom', factor: .01 })

}


// Something to test later
// let rgb1 = "rgb(0, 33, 133)";  // blue
// let rgb2 = "rgb(252, 211, 0)"; // yellow
// let t = 0.5;                   // mixing ratio

// let mixed  = mixbox.lerp(rgb1, rgb2, t);

// let pathData = "M225.9,243.7c-5,2.2-11.2,1.5-15.8-0.4c-11.7-4.8-15.2-19.8-11.3-30.9c3-8.9,11.1-14.6,20.6-14.4c9.2-0.2,18.3,6.2,19,15.9 H229c-1.3-7.3-9.4-9.3-15.2-6.3c-5,2.7-6.5,8.8-6.6,14.2c-0.2,7.4,3.8,15.4,12.2,15.1c6.5,0,10.1-3.3,10.7-9.7h-10v-7.4h18.9V244 h-6.3l-1-5.1C230,241.2,228.1,242.8,225.9,243.7z"
// let cPathData = "M236.6,403.7c0-15.8,22.7-23.1,33.7-26.6c-4.1-2.8-7.9-5.7-7.9-11c0-5.1,8.3-12.8,12.8-16v-0.4c-8.9-2-17.8-8.7-17.7-23.3 c0-14,13.4-41,46.7-41c3.2,0,6.1,0.6,9.9,2c3.2,1,5.9,3.2,7.7,3.2c2.8,0,5.9-0.8,8.3-1.6c3.2-1.2,6.9-2.4,9.9-2.4 c3.7,0,6.9,2.4,6.9,8.3c0,6.9-4.5,8.3-6.7,8.3c-1.8,0-3.5-0.4-5.7-1.2c-1.8-0.6-3.7-1.2-5.1-1.2c-0.8,0-1.6,0.8-1.4,2.2 c0.2,1.6,0.6,4.3,0.6,5.7c0,22.7-18.7,40.6-44.2,41.8c-1.2,1-3,3.2-3,4.9c0,2.8,7.3,7.1,14.2,10.5c11.4,5.7,30.2,14.6,30.2,30.6 c0,21.5-34.5,27.4-51.3,27.4C260.3,424,236.6,419.9,236.6,403.7z M268.2,387.1c-3.4,2.8-6.5,7.3-6.5,12.4c0,9.3,10.8,14.6,23.7,14.6 c11.4,0,19.5-4.1,19.5-10.3c0-5.1-4.1-9.7-9.9-13.6c-7.7-4.9-13.6-7.7-15.8-7.7C277.2,382.4,271.7,384.2,268.2,387.1z M292,302.7 c-5.9,7.9-12.6,23.7-12.6,33.1c0,3.8,2,5.9,5.5,5.9c4.5,0,9.7-6.1,14.6-15c4.1-7.1,8.9-20.1,8.9-25.8c0-4.3-2.4-6.5-5.1-6.5 C300.1,294.4,296.2,297,292,302.7z"


// Splitting path with another path into many 
//https://stackoverflow.com/questions/23258001/slice-path-into-two-separate-paths-using-paper-js
const splitUsingPath = (target, path) => {
    const paths = [path];
    const targets = [target];
    
    const originalTarget = target.clone({ insert: false })
    const intersections = target.getIntersections(path)

    intersections.forEach(location => {
      const newTarget = target.splitAt(location)
      const isNew = newTarget !== target
      
      if (isNew) targets.push(newTarget)
    
      paths.forEach(path => {
          const offset = path.getOffsetOf(location.point)
          const pathLocation = path.getLocationAt(offset)

          if (pathLocation) {
                paths.push(path.splitAt(pathLocation))
          }
      })
    })

    const innerPath = paths.find(p => 
        originalTarget.contains(p.bounds.center))

    paths
        .filter(path => path !== innerPath)
        .forEach(item => item.remove())


    targets.forEach((target, i) => {
		const isFirst = i === 0
		const innerPathCopy = isFirst ? innerPath : innerPath.clone()

		if (innerPathCopy.getPointAt(0).isClose(target.getPointAt(target.length), 0.1)) innerPathCopy.reverse()

        target.join(innerPathCopy, innerPathCopy.length)
        target.closed = true

		if (c.debug) {
			let p  = new PointText({
				point: target.bounds.center,
				content: target.clockwise,
				fontSize: 10,
				fontColor: 'black',
				parent: debug
			})
		}
    })

    return targets
}


function getNormal(line) {

	let mid = getMidpoint(line)
	
	let n = line.getNormalAt(line.length / 2)

	if (c.debug) {
		let debug = new Path.Line({
			from: mid,
			to: escapePoint,
			strokeWidth: 1,
			strokeColor: '#ea570e',
			opacity: .15
		})
	}

	line.remove()

	return n
}

function getMidpoint(line) {
	return line.getPointAt(line.length / 2)
}

function reSample(path, density) {
    let genPoints = []
		
		let l = path.length
		let count = Math.floor(l / density)
		
		for (let i = 0; i < count; i++) {
			genPoints.push(path.getPointAt(l / count * i))
		}

		let genPath = new Path({
			strokeColor: path.strokeColor,
			strokeWidth: path.strokeWidth,
			fillColor: path.fillColor,
			segments: genPoints
		})

		if (path.closed) genPath.closed = true
		
		return genPath
}


let slicePath

function onMouseDrag(event) {

	// Add points to slicing path while dragging
	slicePath.add(event.point)
}


function onMouseDown(event) {

	// Init slicing path
		slicePath = new Path({
			segments: [event.point],
			strokeColor: 'magenta',
			strokeWidth: 1,
			parent: toolL,
			dashArray: [10,10]
		})
}

R = utils.getRandomInt

function onMouseUp(event) {

	// Draw the art after mouse button released
	debug.removeChildren()
	draw.removeChildren()

	slicePath.add(event.point)

	slicePath.simplify(200);

	let pathsToCut = orig.children.map(x => x.id)
	
	// The slicing part
	pathsToCut.forEach(pathId => {
		let path = orig.getItem({id:pathId})
		let slicer = slicePath.clone()

		if (c.debug) {
			slicer.fullySelected = true
		}

		let ints = path.getIntersections(slicer)


		if (ints.length > 0) {

			let res = splitUsingPath(path, slicer)	

			res.forEach(el => {
				el.strokeColor = c.strokeColor
				el.strokeWidth = c.strokeWidth
				el.fillColor = c.fillColor
				
				round(el, c.rounding)
				
				if (c.debug) {
					el.fullySelected = true
				}
			})
		}
		
	})

	// Sort slices from top to bottom (for colorisation)
	orig.children.sort((a, b)  => a.bounds.top - b.bounds.top)

	// If effects are toggled, draw those to separate layer
	orig.children.forEach((el,index) => {

		if (c.innerLine) {

			let off = (Math.max(el.bounds.width, el.bounds.height) / 14) + 5

			let o = PaperOffset.offset(el, -off)

			if (o != undefined && !o.hasChildren())  {

				o.parent = draw
				o.fillColor = null
				o.strokeWidth = 1
				o.dashArray = [5,5]
	
				if (c.debug) {
					o.strokeColor = 'magent'
					o.strokeWidth = 1
				}
		
			}
		}

		if (c.lineFill) {
			let g = Math.min(index * (10 / 255), 0.95)
			
			let col = new Color(g,g,g)

			fillElWithRandomLines(el, col)
		}

	})

	
	if (c.debug) {
		orig.children.forEach((el, index) => {
			new Path.Circle({
				center: el.getPointAt(0),
				radius: 3,
				fillColor: 'red',
				parent: debug
			})
		})
	}

	if (!c.debug) {
		toolL.removeChildren()
	}
}



allSegmentsWithinRadius = []

// Round segments, optionally give array of segments as attribute
function round(path, r, sharps) {

	if (sharps == undefined) {
		sharps = []

		path.segments.forEach(s => {
			if (!s.isSmooth()) sharps.push(s.location)
		})

	}

	let ref = path.clone()

 
	sharps.forEach(s => {
		roundSegment(path, s.segment, r, sharps, ref)
	})

	ref.remove()

}

// Round one segment on a path. Adds additional points at radius distance from a segment.
function roundSegment(path, segment, radius, ints, referencePath) {
	var curPoint = segment.point 

	var curOff = segment.location.offset
	var refCurOff = referencePath.getOffsetOf(segment.point)

	// get radius that is adjusted smaller if intersections are close to each other
	//Check that segment and next or previous rounded segments radiuses don't overlap
	var radiusBandF = getAdjustedRadius(referencePath, refCurOff, radius, ints)

	// get offset of the location where new point should be placed
	var off2 = offsetCalc(path, curOff + radiusBandF[1])
	
	// Get segments that are within rounding radius and should be removed
	var segsAtRounding = getSegmentsWithinRadius(path, segment, radiusBandF)
	allSegmentsWithinRadius.push(...segsAtRounding)

	// Add latter point and set incoming handle
	var p2 = addPointToCurve( path, off2 )
	if (p2 != undefined) {
		p2.handleIn.length = radiusBandF[1] / 2
		if (p2.handleIn.angle == undefined) p2.handleIn.angle = path.getLocationAt(p2).location.tangent.angle
	}

	// get offset of the location where latter point should be placed
	// have to get offset again since adding point to curve changes path structure
	var off1 = offsetCalc(path, path.getOffsetOf(curPoint) - radiusBandF[0]) 
	
	// Add former point and set outgoing handle
	var p1 = addPointToCurve( path, off1 )
	if (p1 != undefined) p1.handleOut.length = radiusBandF[0] / 2

	// Finish by removing all segments within rounding radius including the segment to be rounded to begin with	
	segment.remove()
	// if (segsAtRounding.length > 0) {
	// 	for (var s = 0; s < segsAtRounding.length; s++) {
	// 		segsAtRounding[s].remove()
	// 	}
	// }

}

//Check that segment and next or previous rounded segments radiuses don't overlap
function getAdjustedRadius(path, curOff, radius, ints) {
	
	var result = [radius, radius]

	for (var i = 0; i < ints.length; i++) {
		// var intOff = path.getNearestLocation(ints[i][1].point).offset // get offset of an intersection point
		var intOff = path.getOffsetOf(ints[i].point) // get offset of an intersection point

		var intDist = getRealDistance(intOff, curOff, path.length) // get distance between point being rounded and another intersection

		function getRealDistance(a, b, full) {
			var distResult = [ getDifference(intOff, curOff), false ] // difference between points, false as default indicator that points are not across zero point
			var half = full / 2

			if (distResult[0] > half) { // if distance between points is greater than half the total length of a path, then shortest distance between them must cross the zero point
				
				a = (a > half) ? full - a : a
				b = (b > half) ? full - b : b

				var dist = (a + b > half) ? full - (a + b) : a + b
				distResult = [ dist, true ]
			}

			return distResult
		}

		// console.log('result: ' + result)

		if (intDist[0] / 2 < radius && intOff != curOff && intOff != null && intDist[0] > 0.1) {
			if (c.debug) {
				if (c.debugVerbose) {
					console.log('ADJUSTED RADIUS')
					console.log(i)
					console.log('intDist: ' + intDist)
					console.log('curOff: ' + curOff)
					console.log('intOff: ' + intOff)
					console.log('pathlength: ' + path.length)
					console.log(ints[i][1])
				}

				var con = new Path.Circle({
					center: ints[i][1].point,
					radius: 5,
					name:'con',
					fillColor: 'pink'
				})
			}

			var adj = intDist[0]/1000

			if (curOff > intOff) {
				result[0] = (intDist[0] / 2) - adj // if intersection points are too close to each other, default radius to half their distance
			}
			if (curOff < intOff) {
				result[1] = (intDist[0] / 2) - adj
			}
			
			if (intDist[1]) {
				if (c.debug) {
					var zer = new Path.Circle({
						center: ints[i][1].point,
						radius: 20,
						fillColor:'pink'
					})
				}
				if (curOff > intOff) {
					result[1] = (intDist[0] / 2) - adj // if intersection points are too close to each other, default radius to half their distance
				}
				if (curOff < intOff) {
					result[0] = (intDist[0] / 2) - adj
				}
			}
 		}

	}

	return result
}

function getDifference(a, b) {
	return Math.abs(a - b);
}

// Add a new segment to a curve so that appearance of the curve is not altered
function addPointToCurve(path, offset) {
	var p = path.getPointAt(offset)
	path.splitAt(path.getLocationAt(offset))
	path.join(path)
	
	if (path.getLocationOf(p) != undefined) {
		var result = path.getLocationOf(p).segment
		return result
	}
	else { 
		return undefined
	}

}

// Calculate offset taking into account looping over path end
function offsetCalc(path, off) {
	var result = off

	if (path.length < off) result = off - path.length

	if (off < 0) result = path.length - Math.abs(off)
		
	return result
}

// Get segments of a path that lie between two offset values
function getSegmentsWithinRadius(path, seg, radiusBandF) {
	var result = []

	var myOff = seg.location.offset
	var nonAdjustedOff1 = myOff - radiusBandF[0]
	var off1 = offsetCalc(path, nonAdjustedOff1)
	var nonAdjustedOff2 = myOff + radiusBandF[1]
	var off2 = offsetCalc(path, nonAdjustedOff2)

	if (c.debug) {
		var con = new Path.Circle({
			center: path.getPointAt(off1),
			radius: 3,
			fillColor: 'purple'
		})
		var con = new Path.Circle({
			center: path.getPointAt(off2),
			radius: 3,
			fillColor: 'cyan'
		})
	}

	for (s = 0; s < path.segments.length; s++) {
		var myS = path.segments[s]
		var sOff = myS.location.offset
		

		if (sOff >= off1 && sOff <= off2) {
			result.push(myS)
		} 
		if (off1 > off2) { // radius over zeropoint
			if (sOff >= nonAdjustedOff1 && sOff <= nonAdjustedOff2) {
				result.push(myS)
			}
		}
	}

	return result
}

// Fill path with random lines
function fillElWithRandomLines(el) {
		let f = 3
		let gray = 0.1

		if (el.fillColor != null) {
			gray = el.fillColor.gray + 0.1
			f = gray * c.lineFillFreq + 5
		}
		
		let b = el.bounds
		let rnd = utils.getRandomInt(0, 20)
		let rot = gray * 90 + rnd

		let v = new Point({
			angle: rot,
			length: 1
		})

		let n = new Point({
			angle: rot + 90,
			length: 1			
		})

		let line = new Path.Line({
			from: view.center,
			to: view.center - n * (getMaxDim(el) * 2),
			strokeWidth: c.lineFillWidth,
			strokeColor: c.lineFillColor,
			// fullySelected: true		
		})

		let pCount = utils.getRandomInt(1,5)

		let rnds = utils.getRandomSpacedInts(5,line.length - 5, pCount, line.length / 5)
		if (rnds == undefined || rnds == null || !rnds) rnds = [line.length / 2]
		// console.log(rnds)
		rnds.reverse()

		for (let i = 0; i < pCount; i++) {
			line.insert(1, line.getPointAt(rnds[i]))			
		}

		line.segments.forEach((seg, index) => {
			if (!seg.isFirst() && !seg.isLast()) { 
				let normal = seg.location.normal * utils.getRandomInt(10, 200)
				if (utils.maybe()) {
					 seg.point += normal 
				}
				else (
					seg.point -= normal
				)
				
			}
 		})

		line.smooth()

		let clipGroup = fillShape(el, line, rot, f, v)
		
		// addFilled(el.id, el, line, clipGroup, rot, f, v)

		line.remove()
}

function getMaxDim(el) {
	let b = el.bounds
	let h = b.height
	let w = b.width

	let max = Math.max(h, w)

	return max
}

// Fills given shape with repeating lines (provided as an attribute)
function fillShape(shape, line, rotation, frequency, vector) {
	let clipGroup = new Group()
	let clip = shape.clone()

	if (vector) vector.length = 1
	
	let b = clip.bounds
	let h = b.height
	let w = b.width

	let max = Math.max(h, w)
	let lineAmount = Math.floor(max * 10 / frequency)

	let lineGroup = new Group({
		parent: clipGroup
	})

	let orig = line.bounds.center.clone()

	for ( let i = 0; i < lineAmount; i++ ) {

		let y = (b.top - max * 0.25) + max * 1.5 / lineAmount * i

		let cl = line.clone()

		if (vector) {
			cl.position = orig + vector * frequency * i
		}

		else {
			cl.position = new Point(b.center.x, y)
		}

		cl.parent = lineGroup
	}

	// lineGroup.rotate(rotation)
	lineGroup.position = clip.bounds.center
	
	clip.parent = clipGroup
	clip.clipMask = true

	clipGroup.parent = draw

	return clipGroup
}


// Export SVG ========================================================

var  exportButton = document.getElementById('export-button');

exportButton.addEventListener("click", function(e) {
	var svg = project.exportSVG({asString: true});
	var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
	saveAs(blob, 'image.svg');
}, false);

// Log project ========================================================

var  projectExportButton = document.getElementById('log-project')

projectExportButton.addEventListener("click", function(e) {
	console.log(project)
	console.log(c)
}, false)

// UI listeners ================================================
function addListener(elId, type, init = false) {
	document.getElementById(elId).onchange = function() {

		if (type == null) eval('c.' + elId + ' = parseInt(this.value)');
		if (type == 'color') eval('c.' + elId + ' = utils.hex2color(this.value)');
		if (type == 'checkbox') eval('c.' + elId + ' = this.checked');

		if (init) {
			initScene()
		}

		// update()
	}
}
addListener('fillColor', 'color', true)
addListener('strokeColor', 'color', true)
addListener('strokeWidth', null, true)
addListener('lineFillWidth', null, true)
addListener('debug', 'checkbox', true)
addListener('innerLine', 'checkbox', true)
addListener('lineFill', 'checkbox', true)
addListener('lineFillColor', 'color', true)
addListener('lineFillFreq', null, true)
addListener('rounding', null, true)