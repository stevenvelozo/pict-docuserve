# LaTeX Equations

Docuserve supports mathematical notation via [KaTeX](https://katex.org/), a fast LaTeX rendering library. Both inline and display (block) equations are supported.

## Inline Equations

Wrap LaTeX expressions in single dollar signs `$...$` to render them inline with surrounding text.

The quadratic formula $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ solves any equation of the form $ax^2 + bx + c = 0$.

**Source:**

```
The quadratic formula $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ solves
any equation of the form $ax^2 + bx + c = 0$.
```

---

Einstein's mass-energy equivalence $E = mc^2$ relates energy $E$, mass $m$, and the speed of light $c$.

**Source:**

```
Einstein's mass-energy equivalence $E = mc^2$ relates energy $E$,
mass $m$, and the speed of light $c$.
```

## Display Equations

Wrap LaTeX in double dollar signs `$$...$$` on their own lines for centered, large-format equations.

### Gaussian Integral

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

**Source:**

```
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

### Euler's Identity

$$
e^{i\pi} + 1 = 0
$$

**Source:**

```
$$
e^{i\pi} + 1 = 0
$$
```

### Taylor Series

$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x - a)^n
$$

**Source:**

```
$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x - a)^n
$$
```

## Greek Letters

Inline Greek: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\zeta$, $\eta$, $\theta$, $\lambda$, $\mu$, $\pi$, $\sigma$, $\phi$, $\omega$.

Uppercase: $\Gamma$, $\Delta$, $\Theta$, $\Lambda$, $\Sigma$, $\Phi$, $\Psi$, $\Omega$.

**Source:**

```
Inline Greek: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$,
$\zeta$, $\eta$, $\theta$, $\lambda$, $\mu$, $\pi$, $\sigma$,
$\phi$, $\omega$.

Uppercase: $\Gamma$, $\Delta$, $\Theta$, $\Lambda$, $\Sigma$,
$\Phi$, $\Psi$, $\Omega$.
```

## Fractions and Binomials

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

**Source:**

```
$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$
```

## Matrices

$$
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
$$

**Source:**

```
$$
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
$$
```

### Determinant

$$
\det(A) = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc
$$

**Source:**

```
$$
\det(A) = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc
$$
```

## Calculus

### Derivative Definition

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

**Source:**

```
$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$
```

### Partial Derivatives

$$
\nabla f = \frac{\partial f}{\partial x}\hat{i} + \frac{\partial f}{\partial y}\hat{j} + \frac{\partial f}{\partial z}\hat{k}
$$

**Source:**

```
$$
\nabla f = \frac{\partial f}{\partial x}\hat{i} + \frac{\partial f}{\partial y}\hat{j} + \frac{\partial f}{\partial z}\hat{k}
$$
```

### Multiple Integrals

$$
\iiint_V \rho(x, y, z) \, dV = M
$$

**Source:**

```
$$
\iiint_V \rho(x, y, z) \, dV = M
$$
```

## Set Notation

For any sets $A$ and $B$:

$$
A \cup B = \{ x \mid x \in A \text{ or } x \in B \}
$$

$$
A \cap B = \{ x \mid x \in A \text{ and } x \in B \}
$$

$$
A \setminus B = \{ x \mid x \in A \text{ and } x \notin B \}
$$

**Source:**

```
For any sets $A$ and $B$:

$$
A \cup B = \{ x \mid x \in A \text{ or } x \in B \}
$$

$$
A \cap B = \{ x \mid x \in A \text{ and } x \in B \}
$$

$$
A \setminus B = \{ x \mid x \in A \text{ and } x \notin B \}
$$
```

## Logic and Proofs

$$
\forall \epsilon > 0, \exists \delta > 0 : |x - a| < \delta \implies |f(x) - L| < \epsilon
$$

**Source:**

```
$$
\forall \epsilon > 0, \exists \delta > 0 : |x - a| < \delta \implies |f(x) - L| < \epsilon
$$
```

## Summations and Products

### Geometric Series

$$
\sum_{k=0}^{n} ar^k = a \cdot \frac{1 - r^{n+1}}{1 - r}, \quad r \neq 1
$$

**Source:**

```
$$
\sum_{k=0}^{n} ar^k = a \cdot \frac{1 - r^{n+1}}{1 - r}, \quad r \neq 1
$$
```

### Euler Product

$$
\prod_{p \text{ prime}} \frac{1}{1 - p^{-s}} = \sum_{n=1}^{\infty} \frac{1}{n^s} = \zeta(s)
$$

**Source:**

```
$$
\prod_{p \text{ prime}} \frac{1}{1 - p^{-s}} = \sum_{n=1}^{\infty} \frac{1}{n^s} = \zeta(s)
$$
```

## Aligned Equations

KaTeX supports the `aligned` environment for multi-line derivations.

$$
\begin{aligned} (a + b)^2 &= (a + b)(a + b) \\ &= a^2 + ab + ba + b^2 \\ &= a^2 + 2ab + b^2 \end{aligned}
$$

**Source:**

```
$$
\begin{aligned} (a + b)^2 &= (a + b)(a + b) \\ &= a^2 + ab + ba + b^2 \\ &= a^2 + 2ab + b^2 \end{aligned}
$$
```

## Piecewise Functions

$$
|x| = \begin{cases} x & \text{if } x \geq 0 \\ -x & \text{if } x < 0 \end{cases}
$$

**Source:**

```
$$
|x| = \begin{cases} x & \text{if } x \geq 0 \\ -x & \text{if } x < 0 \end{cases}
$$
```

## Accents and Decorations

$\hat{x}$, $\bar{x}$, $\vec{v}$, $\dot{x}$, $\ddot{x}$, $\tilde{x}$, $\overline{AB}$, $\underline{text}$, $\overbrace{a+b+c}^{n}$

**Source:**

```
$\hat{x}$, $\bar{x}$, $\vec{v}$, $\dot{x}$, $\ddot{x}$,
$\tilde{x}$, $\overline{AB}$, $\underline{text}$,
$\overbrace{a+b+c}^{n}$
```

## Tips

- KaTeX is loaded from CDN. An internet connection is required for equation rendering.
- If KaTeX is unavailable, the raw LaTeX source is displayed as plain text.
- Use single `$` for inline math and double `$$` on their own lines for display math.
- Avoid putting spaces directly after the opening `$` or before the closing `$` in inline math, as the parser uses this to distinguish math from currency.
- KaTeX supports most common LaTeX commands. See the [KaTeX function support table](https://katex.org/docs/supported) for details.
