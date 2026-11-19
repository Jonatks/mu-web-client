// Uso: dotnet run -- <formula.txt> <expected.txt> <maximo>. Sale con 1 si un nivel no da lo esperado.
using org.mariuszgromada.math.mxparser;

var formula = File.ReadAllText(args[0]).Trim();
var expected = File.ReadAllLines(args[1]).Where(l => l.Length > 0).Select(long.Parse).ToArray();
var max = int.Parse(args[2]);
var argument = new Argument("level");
var expression = new Expression(formula);
expression.addArguments(argument);
var bad = 0;
for (var level = 0; level < max + 2; level++)
{
    argument.setArgumentValue(level);
    var got = (long)expression.calculate();
    if (got != expected[level]) { bad++; if (bad < 10) Console.WriteLine($"nivel {level}: {got}, se esperaba {expected[level]}"); }
}
Console.WriteLine(bad == 0 ? $"formula correcta en los {max + 2} niveles" : $"{bad} niveles distintos");
return bad == 0 ? 0 : 1;
