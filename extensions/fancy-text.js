var prefix = 'ft_';

SnapExtensions.primitives.set(
    prefix+'is_bubble(part)',
    part => part.isBubble
)


SnapExtensions.primitives.set(
    prefix+'render(aString, canvas, fontSize, offsetX, offsetY, font, color)',
    (aString, canvas, fontSize, offsetX, offsetY, font, color) => renderText(aString, canvas, fontSize, offsetX, offsetY, font, color)
)

SnapExtensions.primitives.set(
    prefix+'render_calculate_offsets(aString, canvas, fontSize, font, color)',
    (aString, canvas, fontSize, font, color) => renderText(aString, canvas, fontSize, canvas.height/2, canvas.height/8, font, color)
)

SnapExtensions.primitives.set(
    prefix+'measure_text(contents, fontSize, font)',
    (contents, fontSize, font) => renderText(contents, newCanvas(), fontSize, 0, 0, font)
)

SnapExtensions.primitives.set(
    prefix+'new_canvas(w,h)',
    (w,h) => newCanvas(new Point(parseInt(w),parseInt(h)))
)

SnapExtensions.primitives.set(
    prefix+'array_to_list',
    array => new List(array)
)

SnapExtensions.primitives.set(
    prefix+'draw_empty_bubble(canvas, tipPos)',
    (canvas, tipPos) => {
        var ctx = canvas.getContext('2d'),
            w = canvas.width,
            h = canvas.height,
            r = h/4;

        ctx.save();

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';

// Tip
        function drawTip(fillIt) {
            ctx.beginPath();
            switch (tipPos) {
                case 'top left':
                    ctx.moveTo(0, 0);
                    ctx.lineTo(2*r, r/2);
                    ctx.lineTo(2*r, r);
                    break;
                case 'bottom left':
                    ctx.moveTo(0, h);
                    ctx.lineTo(2*r, h-r/2);
                    ctx.lineTo(2*r, h-r);
                    break;
                case 'top right':
                    ctx.moveTo(w, 0);
                    ctx.lineTo(w-2*r, r/2);
                    ctx.lineTo(w-2*r, r);
                    break;
                case 'bottom right':
                    ctx.moveTo(w, h);
                    ctx.lineTo(w-2*r, h-r/2);
                    ctx.lineTo(w-2*r, h-r);
                    break;
            }
            ctx.closePath();
            if (fillIt) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }

        drawTip(false);

// Bubble
        ctx.beginPath();
        ctx.moveTo(2*r, 0);

//top
        ctx.lineTo(w-2*r, 0);
//top right
        ctx.arcTo(w-r, 0, w-r, r, r);
// right
        ctx.lineTo(w-r, h-r);
// bottom right
        ctx.arcTo(w-r, h, w-2*r, h, r);
// bottom
        ctx.lineTo(2*r, h);
// bottom left
        ctx.arcTo(r, h, r, h-2*r, r);
// left
        ctx.lineTo(r, r);
// top left
        ctx.arcTo(r, 0, r*2, 0, r);

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawTip(true);

        ctx.restore();

        canvas.tipPosition = tipPos;
    }
)

SnapExtensions.primitives.set(
    prefix+'new_bubble',
    (proc) => {
        var s = new SpriteMorph(new VariableFrame());
        proc.receiver.parentThatIsA(StageMorph).add(s);
        s.isTemporary = true;
        s.userMenu = nop;
        s.isBubble = true;
        return s;
    }
)

SnapExtensions.primitives.set(
    prefix+'new_costume (canvas)',
    canvas => new Costume(canvas, 'image')
)

SnapExtensions.primitives.set(
    prefix+'get_tip_position(canvas)',
    canvas => canvas.tipPosition
)

SnapExtensions.primitives.set(
    prefix+'mouseClickLeft(obj)',
    obj => obj.mouseClickLeft()
)

var renderText = function (aString, canvas, fontSize, offsetX, offsetY, font, color) {
    // Takes a pseudo-markdown string, possibly containing fractions, and
    // returns a canvas where the string has been parsed and rendered

    var ctx = canvas.getContext('2d'),
        y = offsetY || 0, x = offsetX || 0, width = 0,
        fontSize = fontSize || 32,
        font = font || 'Arial', color = color || 'black';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = fontSize + 'px '+ font;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    aString.split('\n').forEach(line => {
        x = offsetX;

        var fractions = extractFractions(line),
            lineHeight = fontSize;

        Fraction.fontSize = fontSize;

        fractions.forEach(fraction => {
            lineHeight = Math.max(lineHeight, fraction.height());
        })
        var parsingFraction = false,
            fractionParentheses = 0,
            fractionString = "";
        line.split('').forEach((character, i) => {

            if(parsingFraction){
                fractionString += character;
                if(character === '('){
                    fractionParentheses++;
                }
                if(character === ')'){
                    fractionParentheses--;
                }
                if(fractionParentheses === 0){
                    parsingFraction = false;
                    var fraction = parseFraction(fractionString);

                    fraction.drawOn(ctx, x, y + ((lineHeight - fraction.height()) / 2));
                    x += fraction.width();
                    width = Math.max(width, x);
                    fractionString = "";

                }
            }
            else{
                switch (character) {
                    case '*':
                        if (ctx.font.includes('bold ')) {
                            ctx.font = ctx.font.replace('bold ', '');
                        } else {
                            ctx.font = 'bold ' + ctx.font;
                        }
                        break;
                    case '_':
                        if (ctx.font.includes('italic ')) {
                            ctx.font = ctx.font.replace('italic ', '');
                        } else {
                            ctx.font = 'italic ' + ctx.font;
                        }
                        break;
                    case '~':
                        parsingFraction = true;
                        break;
                    default:
                        ctx.fillText(character, x, y + ((lineHeight - fontSize) / 2));
                        x += ctx.measureText(character).width;
                        width = Math.max(width, x);
                        break;

                }
            }

        });
        y += lineHeight;
        // }
    });

    return [width - offsetX, y - offsetY];
};

var extractFractions = function (aString) {
    var parsingFraction = false,
        fractionParentheses = 0,
        fractionString = "",
        fractionStrings = [];
    aString.split('').forEach(character => {
        if(parsingFraction){
            fractionString += character;
            if(character === '('){
                fractionParentheses++;
            }
            if(character === ')'){
                fractionParentheses--;
            }
            if(fractionParentheses === 0){
                parsingFraction = false;
                fractionStrings.push(fractionString);
                fractionString = "";

            }
        }
        else {
            if(character === '~'){
                parsingFraction = true;
            }
        }
    });

    var fractions = [];

    fractionStrings.forEach(fractionString => {
        fractions.push(parseFraction(fractionString))
    })

    return fractions;
}

var parseFraction = function (aString) {
    // * All fractions need to be parenthesized
    // * All non-fractional parts of a numerator or denominator need to be
    //   enclosed by brackets and separated by commas
    // Ex: ([(2/3),+,([4,*,45]/123)]/15)

    return eval(
        aString.replace(
            /\(/gi,
            (match) => 'new Fraction' + match + ''
        ).replaceAll(
            '\/',
            ','
        ).replace(
            /[\+\-\*·]+/gi,
            (match) => "'" + match + "'"
        ).replaceAll(
            '*',
            '×'
        )
    );
};

function Fraction (numerator, denominator) {
    this.init(numerator, denominator);
};

Fraction.prototype.init = function (numerator, denominator) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.isFraction = true;
};

Fraction.debug = false;
Fraction.fontSize = 32;

Fraction.prototype.drawOn = function (context, x, y, totalWidth) {
    var x = x || 0,
        y = y || 0,
        fontSize = Fraction.fontSize,
        width = this.width(),
        totalWidth = totalWidth || width;

    if (Fraction.debug) {
        context.save();
        context.beginPath();
        context.strokeStyle =
            'rgb(' +
            Math.floor(Math.random() * 255) + ',' +
            Math.floor(Math.random() * 255) + ',' +
            Math.floor(Math.random() * 255) + ')';
        context.rect(x, y, width, this.height());
        context.stroke();
        context.restore();
    }

    context.save();
    this.numerator.drawOn(
        context,
        x +
        (this.numerator.isFraction ?
                (totalWidth - this.numerator.width()) / 2 :
                (width - this.numerator.width()) / 2
        ),
        y,
        totalWidth
    );
    context.restore();

    // line
    context.lineWidth = Math.max(fontSize / 12, 1);
    y += this.numerator.height() + context.lineWidth;
    context.save();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.stroke();
    context.restore();
    y += context.lineWidth;

    this.denominator.drawOn(
        context,
        x +
        (this.denominator.isFraction ?
                (totalWidth - this.denominator.width()) / 2 :
                (width - this.denominator.width()) / 2
        ),
        y + context.lineWidth * 2,
        totalWidth
    );

};

Fraction.prototype.width = function () {
    var fontSize = Fraction.fontSize,
        width = Math.max(
            this.numerator.width(fontSize),
            this.denominator.width(fontSize)
        );

    if (this.numerator.isFraction || this.denominator.isFraction) {
        width += fontSize;
    }

    return width;
};

Fraction.prototype.height = function () {
    var fontSize = Fraction.fontSize,
        lineWidth = Math.max(fontSize / 12, 1);
    return this.numerator.height(fontSize) +
        this.denominator.height(fontSize) + lineWidth * 4;
};

// String methods

String.prototype.textMetrics = function () {
    var context = document.createElement('canvas').getContext('2d'),
        metrics;
    context.font = Fraction.fontSize + 'px monospace';
    context.fillText(this, 0, 0);
    return context.measureText(this);
};

String.prototype.width =  function () {
    return this.textMetrics().width;
};

String.prototype.height = function () {
    // The "proper way" is broken:
    /*
    var metrics = this.textMetrics(fontSize);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    */
    return Fraction.fontSize;
};

String.prototype.drawOn = function (context, x, y, totalWidth) {
    context.save();
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.font = Fraction.fontSize + 'px monospace';
    // if (Fraction.debug) {
    //     context.fillStyle =
    //         'rgba(' +
    //         Math.floor(Math.random() * 255) + ',' +
    //         Math.floor(Math.random() * 255) + ',' +
    //         Math.floor(Math.random() * 255) + ',' +
    //         '1)';
    // } else {
    //     context.fillStyle = 'black';
    // }
    context.fillText(this, x, y);
    context.restore();
};

// Number methods

Number.prototype.width = function () {
    return this.toString().width();
};

Number.prototype.height = function () {
    return this.toString().height();
}

Number.prototype.drawOn = function (context, x, y, totalWidth) {
    this.toString().drawOn(context, x, y, totalWidth);
};

// Array methods

Array.prototype.width = function () {
    const reducer = (acc, each) => acc + each.width();
    return this.reduce(reducer, 0);
};

Array.prototype.height = function () {
    const reducer = (acc, each) => Math.max(acc, each.height());
    return this.reduce(reducer, 0);
};

Array.prototype.drawOn = function (context, x, y, totalWidth) {
    var x = x,
        y = y,
        height = this.height();

    this.forEach(
        each => {
            each.drawOn(
                context,
                x,
                y + (height - each.height()) / 2,
                totalWidth
            );
            x += each.width();
        }
    );
};

window.Fraction = Fraction;