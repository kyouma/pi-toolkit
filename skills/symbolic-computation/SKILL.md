---
name: symbolic-computation
description: Symbolic computation with SymPy — algebra, calculus, ODEs, PDEs, special functions, matrix operations, series, code generation, and LaTeX export. Use for analytic derivations, formula manipulation, and symbolic-to-numeric pipelines.
---

# Symbolic Computation with SymPy

## Setup

```bash
# Create and activate a virtual environment (or use an existing one)
python3 -m venv .venv
source .venv/bin/activate
pip install sympy
```

Verify:
```bash
python3 -c "import sympy as sp; print(sp.__version__)"
```

## Quick Reference

### Core objects

| Object | Code | Description |
|--------|------|-------------|
| Symbol | `x = sp.symbols('x')` | Scalar symbol |
| Multiple | `x, y, z = sp.symbols('x y z')` | Separate symbols |
| Real | `t = sp.symbols('t', real=True)` | $t \in \mathbb{R}$ |
| Positive | `s = sp.symbols('s', positive=True)` | $s > 0$ |
| Complex | `z = sp.symbols('z', complex=True)` | $z \in \mathbb{C}$ |
| Function | `f = sp.Function('f')` | Undefined function $f$ |
| Matrix | `sp.Matrix([[1, 2], [3, 4]])` | Symbolic matrix |
| Vector | `sp.Matrix([x, y, z])` | Column vector |

### Common operations

```python
sp.simplify(expr)          # algebraic simplification
sp.expand(expr)            # expand products and powers
sp.factor(expr)            # factor polynomial
sp.apart(expr, x)          # partial fraction decomposition
sp.together(expr)          # combine rational expressions
sp.cancel(expr)            # cancel common factors
expr.subs(x, a)            # substitution
sp.lambdify(x, expr, 'numpy')  # convert to numeric function
```

### Calculus

| Operation | Code |
|-----------|------|
| Derivative | `sp.diff(f(x), x)` |
| Higher derivative | `sp.diff(f(x), x, n)` |
| Mixed partial | `sp.diff(f(x, y), x, y)` |
| Indefinite integral | `sp.integrate(f(x), x)` |
| Definite integral | `sp.integrate(f(x), (x, a, b))` |
| Multiple integral | `sp.integrate(f(x,y), (x, a, b), (y, c, d))` |
| Limit | `sp.limit(f(x), x, 0)` |
| Series expansion | `sp.series(f(x), x, 0, n)` |
| Summation | `sp.summation(f(k), (k, 0, n))` |
| Product | `sp.product(f(k), (k, 1, n))` |

### Algebra and equation solving

```python
# Solve algebraic equation
sp.solve(sp.Eq(x**2 - 4, 0), x)          # → [-2, 2]

# Solve system
sp.solve([sp.Eq(x + y, 1), sp.Eq(x - y, 2)], [x, y])

# Solve transcendental
sp.nsolve(sp.Eq(sp.cos(x), x), 0.5)      # numeric root near 0.5

# Solve linear system (matrix form)
A = sp.Matrix([[1, 2], [3, 4]])
b = sp.Matrix([5, 6])
A.LUsolve(b)                              # → [-4, 9/2]
```

### ODEs

```python
x = sp.symbols('x')
y = sp.Function('y')

# First order: y' = y
ode = sp.Eq(sp.diff(y(x), x), y(x))
sp.dsolve(ode, y(x))                      # → C₁ exp(x)

# Second order: y'' - 2y' + y = 0
ode2 = sp.Eq(sp.diff(y(x), x, 2) - 2*sp.diff(y(x), x) + y(x), 0)
sp.dsolve(ode2, y(x))                     # → (C₁ + C₂ x) exp(x)

# With initial conditions
sp.dsolve(ode2, y(x), ics={y(0): 1, sp.diff(y(x), x).subs(x, 0): 0})
```

### Matrix operations

```python
A = sp.Matrix([[1, 2], [3, 4]])
A.det()                 # determinant
A.inv()                 # inverse
A.eigenvals()           # eigenvalues
A.eigenvects()          # eigenvectors
A.rank()                # rank
A.nullspace()           # nullspace basis
*A, A.T, A.H            # product, transpose, conjugate transpose
```

### Special functions

| Function | SymPy | Formula |
|----------|-------|---------|
| Gamma | `sp.gamma(z)` | $\Gamma(z) = \int_0^\infty t^{z-1} e^{-t} dt$ |
| Beta | `sp.beta(x, y)` | $B(x,y) = \Gamma(x)\Gamma(y)/\Gamma(x+y)$ |
| Zeta | `sp.zeta(z)` | $\zeta(z) = \sum_{n=1}^\infty n^{-z}$ |
| Error | `sp.erf(x)` | $\operatorname{erf}(x) = \frac{2}{\sqrt{\pi}}\int_0^x e^{-t^2} dt$ |
| Bessel J | `sp.besselj(nu, z)` | $J_\nu(z)$ |
| Bessel Y | `sp.bessely(nu, z)` | $Y_\nu(z)$ |
| Bessel I | `sp.besseli(nu, z)` | $I_\nu(z)$ |
| Bessel K | `sp.besselk(nu, z)` | $K_\nu(z)$ |
| Legendre | `sp.legendre(n, x)` | $P_n(x)$ |
| Hermite | `sp.hermite(n, x)` | $H_n(x)$ |
| Hypergeometric | `sp.hyper([a], [b], z)` | ${}_pF_q(a; b; z)$ |
| Meijer G | `sp.meijerg([a], [b], [c], [d], z)` | $G_{p,q}^{m,n}$ |

### LaTeX export

```python
sp.latex(expr)                       # → inline LaTeX string
sp.latex(expr, mode='equation')      # with \begin{equation}
sp.pretty(expr)                      # terminal-ready ASCII art
```

### Code generation

```python
sp.ccode(expr)               # C/C++
sp.fcode(expr)               # Fortran
sp.jscode(expr)              # JavaScript
sp.lambdify((x,), expr, 'numpy')  # NumPy-compatible function
sp.lambdify((x,), expr, 'math')   # stdlib math
```

## Workflows

### 1. Symbolic derivation of an integral transform

```python
"""
Symbolically derive the Laplace transform of a family of functions:
    ℒ{f}(s) = ∫_0^∞ f(t) e^{-st} dt
"""
import sympy as sp

t, s, a = sp.symbols('t s a', positive=True)

# Laplace transform function
def laplace_transform(f, t, s):
    return sp.integrate(f * sp.exp(-s*t), (t, 0, sp.oo))

# Test various functions
functions = {
    'exp(-a t)': sp.exp(-a*t),
    't^n': t**a,
    'sin(a t)': sp.sin(a*t),
    'cos(a t)': sp.cos(a*t),
    't sin(a t)': t * sp.sin(a*t),
}

for name, f in functions.items():
    F = sp.simplify(laplace_transform(f, t, s))
    print(f"ℒ{{{name}}} = {sp.latex(F)}")
```

### 2. Verify an identity or formula

```python
"""
Verify: Γ(z) Γ(1-z) = π / sin(π z)  (Euler reflection formula)
"""
import sympy as sp

z = sp.symbols('z', complex=True)
lhs = sp.gamma(z) * sp.gamma(1 - z)
rhs = sp.pi / sp.sin(sp.pi * z)

sp.simplify(lhs - rhs)  # → 0 if identity holds
```

### 3. Symbolic → numeric pipeline

```python
"""
Compute and evaluate a Gaussian integral symbolically,
then convert to a fast numeric function.
"""
import sympy as sp
import numpy as np

x, sigma, mu = sp.symbols('x sigma mu', positive=True)
gaussian = sp.exp(-(x - mu)**2 / (2 * sigma**2)) / (sigma * sp.sqrt(2*sp.pi))

# Symbolic normalization check
norm = sp.integrate(gaussian, (x, -sp.oo, sp.oo))
sp.simplify(norm)  # → 1

# Convert to NumPy function
gauss_numeric = sp.lambdify((x, sigma, mu), gaussian, 'numpy')

# Evaluate numerically
xs = np.linspace(-5, 5, 100)
vals = gauss_numeric(xs, 1.0, 0.0)
```

### 4. Series solution of an ODE

```python
"""
Find a series solution for Airy equation: y'' - x y = 0
"""
import sympy as sp

x = sp.symbols('x')
y = sp.Function('y')
ode = sp.Eq(sp.diff(y(x), x, 2) - x * y(x), 0)

# Compute series solution up to x^10
# Using dsolve with hint='power_series'
sol_series = sp.dsolve(ode, y(x), hint='power_series', n=11)
sol_series
```

## Tips

- Use `sp.Refine(expr, sp.Q.positive(t))` to enforce domain assumptions during simplification
- Use `sp.nsimplify(float_val)` to guess a symbolic expression from a numeric float
- Use `sp.preview(expr)` to render LaTeX in a pop-up window
- For heavy computations, set `sp.simplify(expr, ratio=sp.oo)` to limit simplification depth
- Use `sp.symbols('x:10')` to create `x0, x1, ..., x9` in one go
- Use `sp.init_printing()` for pretty LaTeX output in Jupyter
- SymPy objects are immutable: operations return new expressions
- Watch for assumptions: `sp.symbols('x', real=True)` vs `sp.symbols('x')` — integrals may behave differently
