import { useId, useState } from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function PasswordField(props) {
  const [showPassword, setShowPassword] = useState(false);
  const { id: idProp, label, fullWidth = false, sx, ...rest } = props;
  const generatedId = useId();
  const id = idProp || generatedId;

  return (
    <FormControl fullWidth={fullWidth} sx={sx} variant="outlined">
      {label ? <InputLabel htmlFor={id}>{label}</InputLabel> : null}
      <OutlinedInput
        {...rest}
        id={id}
        label={label}
        type={showPassword ? "text" : "password"}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? "Hide password" : "Show password"}
              edge="end"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  );
}

export default PasswordField;
