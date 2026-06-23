import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { FormRow, FormGrid } from './FormRow'

afterEach(() => cleanup())

describe('FormRow', () => {
  it('renders label associated with control, hint, and error with role=alert', () => {
    render(
      <FormRow label="Username" htmlFor="username" hint="Choose a unique name" error="Username is required">
        <input id="username" type="text" />
      </FormRow>
    )
    // label is associated with control via htmlFor
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    // hint text is rendered
    expect(screen.getByText('Choose a unique name')).toBeInTheDocument()
    // error is rendered with role="alert"
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Username is required')
  })

  it('renders without hint or error when those props are omitted', () => {
    render(
      <FormRow label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormRow>
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    // hint and error are not rendered
    expect(screen.queryByText('Choose a unique name')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('FormGrid', () => {
  it('renders its children', () => {
    render(
      <FormGrid>
        <span>grid child</span>
      </FormGrid>
    )
    expect(screen.getByText('grid child')).toBeInTheDocument()
  })
})
